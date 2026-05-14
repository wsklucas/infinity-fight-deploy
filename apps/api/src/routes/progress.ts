import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'
import { calculateProgress } from '../lib/advance'

export default async function progressRoutes(fastify: FastifyInstance) {
  const authenticate = (fastify as any).authenticate

  fastify.get('/student/:studentId', { onRequest: [authenticate] }, async (request, reply) => {
    const { studentId } = request.params as any

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return reply.status(404).send({ error: 'Student not found' })

    const sublevels = await prisma.sublevel.findMany({
      include: { criteria: true },
      orderBy: { order: 'asc' },
    })

    const lastEvaluations = await prisma.evaluation.findMany({
      where: { studentId, status: 'COMPLETED' },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    const sublevelOrder = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C']
    const currentIdx = sublevelOrder.indexOf(student.currentSublevel)

    const result = sublevels.map(sub => {
      const subIdx = sublevelOrder.indexOf(sub.id)
      let state: 'completed' | 'active' | 'locked'
      if (subIdx < currentIdx) state = 'completed'
      else if (subIdx === currentIdx) state = 'active'
      else state = 'locked'

      const lastEval = lastEvaluations.find(e => e.sublevelId === sub.id)
      const progress = lastEval ? calculateProgress(sub.criteria, lastEval.items) : (state === 'completed' ? 100 : 0)

      return { id: sub.id, level: sub.level, label: sub.label, state, progress, criteria: sub.criteria }
    })

    return { sublevels: result, current_sublevel: student.currentSublevel }
  })

  fastify.get('/student/:studentId/current', { onRequest: [authenticate] }, async (request, reply) => {
    const { studentId } = request.params as any

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return reply.status(404).send({ error: 'Student not found' })

    const sublevel = await prisma.sublevel.findUnique({
      where: { id: student.currentSublevel },
      include: { criteria: { orderBy: { order: 'asc' } } },
    })

    const lastEval = await prisma.evaluation.findFirst({
      where: { studentId, sublevelId: student.currentSublevel },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    const criteriaStates = sublevel!.criteria.map(c => ({
      ...c,
      state: lastEval?.items.find(i => i.criterionId === c.id)?.state ?? null,
    }))

    const progress = lastEval ? calculateProgress(sublevel!.criteria, lastEval.items) : 0

    return { sublevel, progress, criteria_states: criteriaStates, evaluation_id: lastEval?.id ?? null }
  })
}
