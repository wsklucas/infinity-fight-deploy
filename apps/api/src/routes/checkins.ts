import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

export default async function checkinRoutes(fastify: FastifyInstance) {
  const authenticate = (fastify as any).authenticate

  fastify.post('/', { onRequest: [authenticate] }, async (request, reply) => {
    const user = (request as any).user

    const student = await prisma.student.findFirst({ where: { userId: user.id } })
    if (!student) return reply.status(404).send({ error: 'Student not found' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await prisma.checkin.findUnique({
      where: { studentId_date: { studentId: student.id, date: today } },
    })
    if (existing) return reply.status(409).send({ error: 'Already checked in today' })

    const checkin = await prisma.checkin.create({
      data: { studentId: student.id, date: today },
    })

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const hadYesterday = await prisma.checkin.findUnique({
      where: { studentId_date: { studentId: student.id, date: yesterday } },
    })

    const newStreak = hadYesterday ? student.currentStreak + 1 : 1
    const newMax = Math.max(newStreak, student.maxStreak)

    await prisma.student.update({
      where: { id: student.id },
      data: {
        currentStreak: newStreak,
        maxStreak: newMax,
        trainingDays: { increment: 1 },
      },
    })

    return reply.status(201).send({ checkin, streak: newStreak, streak_max: newMax })
  })

  fastify.get('/student/:studentId', { onRequest: [authenticate] }, async (request) => {
    const { studentId } = request.params as any

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    const checkins = await prisma.checkin.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 90,
    })

    return { checkins, streak: student?.currentStreak ?? 0, streak_max: student?.maxStreak ?? 0 }
  })
}
