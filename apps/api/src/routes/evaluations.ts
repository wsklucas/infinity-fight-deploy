import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { calculateAdvance, getNextSublevel } from '../lib/advance'

export default async function evaluationRoutes(fastify: FastifyInstance) {
  const authenticate = (fastify as any).authenticate
  const authenticateInstructor = (fastify as any).authenticateInstructor

  fastify.post('/', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const user = (request as any).user
    const schema = z.object({
      student_id: z.string().uuid(),
      sublevel_id: z.string(),
      type: z.enum(['REGULAR', 'INTAKE']),
    })
    const { student_id, sublevel_id, type } = schema.parse(request.body)

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId: student_id,
        instructorId: user.id,
        sublevelId: sublevel_id,
        type,
        status: 'IN_PROGRESS',
      },
      include: { sublevel: { include: { criteria: { orderBy: { order: 'asc' } } } } },
    })

    return reply.status(201).send({ evaluation })
  })

  fastify.patch('/:id/items', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const { id } = request.params as any
    const schema = z.object({
      items: z.array(z.object({
        criterion_id: z.string(),
        state: z.enum(['MASTERED', 'DEVELOPING', 'NOT_STARTED']),
        observed_value: z.number().optional(),
      })),
    })
    const { items } = schema.parse(request.body)

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: { sublevel: { include: { criteria: true } } },
    })
    if (!evaluation) return reply.status(404).send({ error: 'Evaluation not found' })

    await Promise.all(items.map(item =>
      prisma.evaluationItem.upsert({
        where: { evaluationId_criterionId: { evaluationId: id, criterionId: item.criterion_id } },
        update: { state: item.state, observedValue: item.observed_value },
        create: { evaluationId: id, criterionId: item.criterion_id, state: item.state, observedValue: item.observed_value },
      })
    ))

    const allItems = await prisma.evaluationItem.findMany({ where: { evaluationId: id } })
    const criteria = evaluation.sublevel.criteria

    const advanceResult = calculateAdvance(criteria, allItems)

    return {
      evaluation: { id, sublevelId: evaluation.sublevelId },
      can_advance: advanceResult.canAdvance,
      progress: advanceResult.progress,
      blocker_ni: advanceResult.blockerNI,
      complementary_ni: advanceResult.complementaryNI,
      reason: advanceResult.reason,
    }
  })

  fastify.post('/:id/advance', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const { id } = request.params as any

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        student: true,
        sublevel: { include: { criteria: true } },
        items: true,
      },
    })
    if (!evaluation) return reply.status(404).send({ error: 'Evaluation not found' })

    const advanceResult = calculateAdvance(evaluation.sublevel.criteria, evaluation.items)
    if (!advanceResult.canAdvance) {
      return reply.status(400).send({ error: 'Student does not meet criteria for advancement', ...advanceResult })
    }

    const nextSublevel = getNextSublevel(evaluation.sublevelId)
    if (!nextSublevel) return reply.status(400).send({ error: 'Student is already at the final sublevel' })

    await prisma.$transaction([
      prisma.evaluation.update({
        where: { id },
        data: { status: 'COMPLETED', result: 'ADVANCED' },
      }),
      prisma.student.update({
        where: { id: evaluation.studentId },
        data: { currentSublevel: nextSublevel },
      }),
    ])

    const updatedStudent = await prisma.student.findUnique({
      where: { id: evaluation.studentId },
      include: { user: { select: { name: true, email: true } } },
    })

    return {
      success: true,
      student: updatedStudent,
      previous_sublevel: evaluation.sublevelId,
      new_sublevel: nextSublevel,
    }
  })

  fastify.get('/student/:studentId', { onRequest: [authenticate] }, async (request) => {
    const { studentId } = request.params as any

    const evaluations = await prisma.evaluation.findMany({
      where: { studentId },
      include: {
        sublevel: true,
        items: { include: { criterion: true } },
        instructor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { evaluations }
  })

  fastify.post('/intake', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const user = (request as any).user
    const schema = z.object({
      student_id: z.string().uuid(),
      result_sublevel: z.string(),
      notes: z.string().optional(),
      block_results: z.array(z.object({
        block: z.number(),
        items: z.array(z.object({
          criterion_id: z.string(),
          state: z.enum(['MASTERED', 'DEVELOPING', 'NOT_STARTED']),
        })),
      })),
    })
    const { student_id, result_sublevel, notes, block_results } = schema.parse(request.body)

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId: student_id,
        instructorId: user.id,
        sublevelId: result_sublevel,
        type: 'INTAKE',
        status: 'COMPLETED',
        result: 'INTAKE_PLACED',
        notes,
      },
    })

    await prisma.student.update({
      where: { id: student_id },
      data: { currentSublevel: result_sublevel, intakeSublevel: result_sublevel, intakeDate: new Date() },
    })

    return reply.status(201).send({
      evaluation,
      student_sublevel: result_sublevel,
    })
  })
}
