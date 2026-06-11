import { FastifyInstance } from 'fastify'
import { prisma } from '../server'
import { getNextSublevel } from '../lib/advance'

type EventType = 'advance' | 'evaluation' | 'intake'

interface HistoryEvent {
  id: string
  type: EventType
  studentName: string
  description: string
  date: string
}

export default async function historyRoutes(fastify: FastifyInstance) {
  const authenticateInstructor = (fastify as any).authenticateInstructor

  fastify.get('/', { onRequest: [authenticateInstructor] }, async (request) => {
    const { limit: limitStr = '100' } = request.query as Record<string, string>
    const limit = Math.min(parseInt(limitStr) || 100, 500)
    const user = (request as any).user

    const [evaluations, intakes] = await Promise.all([
      prisma.evaluation.findMany({
        where: {
          status: 'COMPLETED',
          result: { not: null },
          student: { user: { academyId: user.academyId } },
        },
        include: {
          student: { include: { user: { select: { name: true } } } },
          sublevel: { select: { id: true } },
        },
        orderBy: { evaluatedAt: 'desc' },
        take: limit,
      }),
      prisma.intakeAssessment.findMany({
        where: { academyId: user.academyId },
        include: {
          student: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])

    const events: HistoryEvent[] = []

    for (const ev of evaluations) {
      const name = ev.student.user.name
      const sub = ev.sublevel.id

      if (ev.result === 'ADVANCED') {
        const next = getNextSublevel(sub)
        events.push({
          id: `eval-${ev.id}`,
          type: 'advance',
          studentName: name,
          description: next
            ? `${name} avançou de ${sub} → ${next}`
            : `${name} avançou além de ${sub}`,
          date: ev.evaluatedAt.toISOString(),
        })
      } else if (ev.result === 'MAINTAINED') {
        events.push({
          id: `eval-${ev.id}`,
          type: 'evaluation',
          studentName: name,
          description: `${name} manteve o subnível ${sub}`,
          date: ev.evaluatedAt.toISOString(),
        })
      } else if (ev.result === 'INTAKE_PLACED') {
        events.push({
          id: `eval-${ev.id}`,
          type: 'intake',
          studentName: name,
          description: `${name} foi posicionado no subnível ${sub}`,
          date: ev.evaluatedAt.toISOString(),
        })
      }
    }

    for (const intake of intakes) {
      const name = intake.student.user.name
      events.push({
        id: `intake-${intake.id}`,
        type: 'intake',
        studentName: name,
        description: `${name} ingressou no subnível ${intake.resultSublevel}`,
        date: intake.createdAt.toISOString(),
      })
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return { events: events.slice(0, limit) }
  })
}
