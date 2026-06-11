import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

const SUBLEVEL_ORDER = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C']

interface CriterionResult {
  criterionId: string
  state: string
}

interface BlockResult {
  sublevelId: string
  criterionResults: CriterionResult[]
}

async function computeResultSublevel(blockResults: BlockResult[]): Promise<string> {
  const sorted = [...blockResults].sort(
    (a, b) => SUBLEVEL_ORDER.indexOf(a.sublevelId) - SUBLEVEL_ORDER.indexOf(b.sublevelId)
  )
  if (sorted.length === 0) return '1A'

  const allIds = sorted.flatMap(b => b.criterionResults.map(r => r.criterionId))
  const criteria = await prisma.criterion.findMany({
    where: { id: { in: allIds } },
    select: { id: true, type: true },
  })
  const typeMap = new Map(criteria.map(c => [c.id, c.type]))

  for (const block of sorted) {
    const items = block.criterionResults.map(r => ({
      state: r.state,
      type: typeMap.get(r.criterionId) ?? 'COMPLEMENTARY',
    }))
    const blockerFailed = items.some(i => i.type === 'BLOCKER' && i.state === 'NOT_STARTED')
    const compFailed = items.filter(i => i.type === 'COMPLEMENTARY' && i.state === 'NOT_STARTED').length
    if (blockerFailed || compFailed >= 3) return block.sublevelId
  }

  return sorted[sorted.length - 1].sublevelId
}

export default async function intakeRoutes(fastify: FastifyInstance) {
  const authenticateInstructor = (fastify as any).authenticateInstructor

  fastify.post('/', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const schema = z.object({
      studentId: z.string().uuid(),
      triageData: z.record(z.any()),
      blockResults: z.array(z.object({
        sublevelId: z.string(),
        criterionResults: z.array(z.object({
          criterionId: z.string(),
          state: z.enum(['MASTERED', 'DEVELOPING', 'NOT_STARTED']),
        })),
      })),
      focusNotes: z.string().optional(),
    })

    const body = schema.parse(request.body)
    const user = (request as any).user

    const resultSublevel = await computeResultSublevel(body.blockResults)

    const assessment = await prisma.intakeAssessment.create({
      data: {
        academyId: user.academyId,
        studentId: body.studentId,
        instructorId: user.id,
        resultSublevel,
        triageData: body.triageData,
        blockResults: body.blockResults as object,
        focusNotes: body.focusNotes ?? null,
      },
    })

    await prisma.student.update({
      where: { id: body.studentId },
      data: {
        currentSublevel: resultSublevel,
        intakeSublevel: resultSublevel,
        intakeDate: new Date(),
      },
    })

    return reply.status(201).send({ assessment, resultSublevel })
  })

  fastify.get('/student/:studentId', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const { studentId } = request.params as any
    const assessments = await prisma.intakeAssessment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })
    return { assessments }
  })
}
