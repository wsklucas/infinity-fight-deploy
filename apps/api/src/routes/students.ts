import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

export default async function studentRoutes(fastify: FastifyInstance) {
  const authenticate = (fastify as any).authenticate
  const authenticateInstructor = (fastify as any).authenticateInstructor

  fastify.get('/', { onRequest: [authenticateInstructor] }, async (request) => {
    const user = (request as any).user
    const { sublevel, status } = (request.query as any) || {}

    const students = await prisma.student.findMany({
      where: {
        instructor: { academyId: user.academyId },
        ...(sublevel ? { currentSublevel: sublevel } : {}),
        ...(status === 'active' ? { user: { active: true } } : {}),
        ...(status === 'inactive' ? { user: { active: false } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, active: true } },
        feedbacks: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { students, total: students.length }
  })

  // Must be registered before /:id to avoid 'me' being matched as an ID
  fastify.get('/me', { onRequest: [authenticate] }, async (request, reply) => {
    const { id: userId } = (request as any).user

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, active: true } },
        instructor: { select: { id: true, name: true } },
        feedbacks: { orderBy: { createdAt: 'desc' }, take: 5 },
        checkins: { orderBy: { date: 'desc' }, take: 30 },
      },
    })

    if (!student) return reply.status(404).send({ error: 'Student not found' })

    return {
      student,
      streak: student.currentStreak,
      last_feedback: student.feedbacks[0] ?? null,
    }
  })

  fastify.get('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, active: true } },
        instructor: { select: { id: true, name: true } },
        feedbacks: { orderBy: { createdAt: 'desc' }, take: 5 },
        checkins: { orderBy: { date: 'desc' }, take: 30 },
      },
    })

    if (!student) return reply.status(404).send({ error: 'Student not found' })

    return {
      student,
      streak: student.currentStreak,
      last_feedback: student.feedbacks[0] ?? null,
    }
  })

  fastify.post('/', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const user = (request as any).user
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      instructor_id: z.string().uuid().optional(),
    })
    const { name, email, instructor_id } = schema.parse(request.body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return reply.status(409).send({ error: 'Email already registered' })

    const tmpPassword = Math.random().toString(36).slice(-8)
    const bcrypt = await import('bcryptjs')
    const hashed = await bcrypt.hash(tmpPassword, 10)

    const newUser = await prisma.user.create({
      data: {
        academyId: user.academyId,
        name,
        email,
        password: hashed,
        role: 'STUDENT',
        mustChangePassword: true,
      },
    })

    const student = await prisma.student.create({
      data: {
        userId: newUser.id,
        instructorId: instructor_id ?? user.id,
      },
    })

    return reply.status(201).send({ student, temp_password: tmpPassword })
  })

  fastify.patch('/:id/reset-password', { onRequest: [(fastify as any).authenticateAdmin] }, async (request, reply) => {
    const { id } = request.params as any
    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) return reply.status(404).send({ error: 'Student not found' })

    const tmpPassword = Math.random().toString(36).slice(-8)
    const bcrypt = await import('bcryptjs')
    const hashed = await bcrypt.hash(tmpPassword, 10)
    await prisma.user.update({
      where: { id: student.userId },
      data: { password: hashed, mustChangePassword: true },
    })
    return { temp_password: tmpPassword }
  })

  fastify.patch('/:id/status', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const { id } = request.params as any
    const schema = z.object({ active: z.boolean() })
    const { active } = schema.parse(request.body)

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) return reply.status(404).send({ error: 'Student not found' })

    await prisma.user.update({ where: { id: student.userId }, data: { active } })

    return { ok: true, active }
  })

  fastify.patch('/:id', { onRequest: [authenticateInstructor] }, async (request) => {
    const { id } = request.params as any
    const schema = z.object({
      style_tags: z.array(z.string()).optional(),
      instructor_id: z.string().uuid().optional(),
    })
    const data = schema.parse(request.body)

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(data.style_tags ? { styleTags: data.style_tags } : {}),
        ...(data.instructor_id ? { instructorId: data.instructor_id } : {}),
      },
    })

    return { student }
  })
}
