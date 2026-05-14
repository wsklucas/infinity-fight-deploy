import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

export async function feedbackRoutes(fastify: FastifyInstance) {
  const authenticate = (fastify as any).authenticate
  const authenticateInstructor = (fastify as any).authenticateInstructor

  fastify.post('/', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const user = (request as any).user
    const schema = z.object({
      student_id: z.string().uuid(),
      text: z.string().min(1),
    })
    const { student_id, text } = schema.parse(request.body)

    const feedback = await prisma.feedback.create({
      data: { studentId: student_id, instructorId: user.id, text },
      include: { instructor: { select: { name: true } } },
    })

    return reply.status(201).send({ feedback })
  })

  fastify.get('/student/:studentId', { onRequest: [authenticate] }, async (request) => {
    const { studentId } = request.params as any

    const feedbacks = await prisma.feedback.findMany({
      where: { studentId },
      include: { instructor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    await prisma.feedback.updateMany({
      where: { studentId, readAt: null },
      data: { readAt: new Date() },
    })

    return { feedbacks }
  })
}

export default feedbackRoutes
