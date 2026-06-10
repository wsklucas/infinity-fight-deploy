import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

const lessonInclude = {
  instructor: { select: { id: true, name: true } },
  students: {
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
    },
  },
}

export default async function lessonRoutes(fastify: FastifyInstance) {
  const authenticate = (fastify as any).authenticate
  const authenticateInstructor = (fastify as any).authenticateInstructor

  fastify.get('/', { onRequest: [authenticate] }, async (request) => {
    const user = (request as any).user
    const { from, to } = (request.query as any) || {}

    const where: any = { academyId: user.academyId }

    if (from && to) {
      where.date = { gte: new Date(from), lte: new Date(to) }
    }

    if (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
      where.instructorId = user.id
    } else {
      const student = await prisma.student.findFirst({ where: { userId: user.id } })
      if (student) {
        where.students = { some: { studentId: student.id } }
      }
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: lessonInclude,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    return { lessons }
  })

  fastify.post('/', { onRequest: [authenticate] }, async (request, reply) => {
    const user = (request as any).user
    const schema = z.object({
      title: z.string().min(1),
      type: z.enum(['INDIVIDUAL', 'GROUP']),
      date: z.string(),
      time: z.string(),
      duration_minutes: z.number().int().min(15).optional(),
      student_ids: z.array(z.string().uuid()).optional(),
    })
    const { title, type, date, time, duration_minutes, student_ids } = schema.parse(request.body)

    const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN'
    const status = isInstructor ? 'CONFIRMED' : 'PENDING'

    let instructorId = user.id
    let finalStudentIds: string[] = student_ids ?? []

    if (!isInstructor) {
      const student = await prisma.student.findFirst({ where: { userId: user.id } })
      if (!student) return reply.status(404).send({ error: 'Student not found' })
      instructorId = student.instructorId
      finalStudentIds = [student.id]
    }

    const lesson = await prisma.lesson.create({
      data: {
        academyId: user.academyId,
        instructorId,
        title,
        type,
        date: new Date(date),
        time,
        durationMinutes: duration_minutes ?? 60,
        status,
        ...(finalStudentIds.length
          ? { students: { create: finalStudentIds.map(studentId => ({ studentId })) } }
          : {}),
      },
      include: lessonInclude,
    })

    return reply.status(201).send({ lesson })
  })

  fastify.patch('/:id/students', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const { id } = request.params as any
    const schema = z.object({
      student_ids: z.array(z.string().uuid()),
      action: z.enum(['add', 'remove']),
    })
    const { student_ids, action } = schema.parse(request.body)

    if (action === 'add') {
      await prisma.lessonStudent.createMany({
        data: student_ids.map(studentId => ({ lessonId: id, studentId })),
        skipDuplicates: true,
      })
    } else {
      await prisma.lessonStudent.deleteMany({
        where: { lessonId: id, studentId: { in: student_ids } },
      })
    }

    const lesson = await prisma.lesson.findUnique({ where: { id }, include: lessonInclude })
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' })

    return { lesson }
  })

  fastify.patch('/:id/status', { onRequest: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const schema = z.object({ status: z.enum(['CONFIRMED', 'PENDING', 'CANCELLED']) })
    const { status } = schema.parse(request.body)

    const lesson = await prisma.lesson.findUnique({ where: { id } })
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' })

    if (status === 'CONFIRMED' && user.role === 'STUDENT') {
      return reply.status(403).send({ error: 'Only instructors can confirm lessons' })
    }

    const updated = await prisma.lesson.update({ where: { id }, data: { status } })
    return { lesson: updated }
  })

  fastify.delete('/:id', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const { id } = request.params as any
    await prisma.lesson.delete({ where: { id } })
    return { ok: true }
  })
}
