import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

const studentInclude = {
  student: { include: { user: { select: { id: true, name: true } } } },
}

export default async function financeRoutes(fastify: FastifyInstance) {
  const authenticateInstructor = (fastify as any).authenticateInstructor

  fastify.get('/payments', { onRequest: [authenticateInstructor] }, async (request) => {
    const user = (request as any).user
    const { month, year } = request.query as any

    const payments = await prisma.payment.findMany({
      where: { academyId: user.academyId, month: Number(month), year: Number(year) },
      include: studentInclude,
      orderBy: { createdAt: 'desc' },
    })

    return { payments }
  })

  fastify.post('/payments', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const user = (request as any).user
    const schema = z.object({
      student_id: z.string().uuid(),
      plan: z.enum(['MENSALIDADE', 'AVULSA', 'PLANO_2X', 'PLANO_3X']),
      amount: z.number().positive(),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2020),
    })
    const { student_id, plan, amount, month, year } = schema.parse(request.body)

    const payment = await prisma.payment.create({
      data: { academyId: user.academyId, studentId: student_id, plan, amount, month, year },
      include: studentInclude,
    })

    return reply.status(201).send({ payment })
  })

  fastify.patch('/payments/:id/toggle', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const { id } = request.params as any

    const existing = await prisma.payment.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ error: 'Payment not found' })

    const payment = await prisma.payment.update({
      where: { id },
      data: { paid: !existing.paid, paidAt: !existing.paid ? new Date() : null },
    })

    return { payment }
  })

  fastify.get('/expenses', { onRequest: [authenticateInstructor] }, async (request) => {
    const user = (request as any).user
    const { month, year } = request.query as any

    const expenses = await prisma.expense.findMany({
      where: { academyId: user.academyId, month: Number(month), year: Number(year) },
      orderBy: { createdAt: 'desc' },
    })

    return { expenses }
  })

  fastify.post('/expenses', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const user = (request as any).user
    const schema = z.object({
      description: z.string().min(1),
      amount: z.number().positive(),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2020),
    })
    const { description, amount, month, year } = schema.parse(request.body)

    const expense = await prisma.expense.create({
      data: { academyId: user.academyId, description, amount, month, year },
    })

    return reply.status(201).send({ expense })
  })

  fastify.get('/summary', { onRequest: [authenticateInstructor] }, async (request) => {
    const user = (request as any).user
    const { month, year } = request.query as any

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({ where: { academyId: user.academyId, month: Number(month), year: Number(year) } }),
      prisma.expense.findMany({ where: { academyId: user.academyId, month: Number(month), year: Number(year) } }),
    ])

    const received = payments.filter(p => p.paid).reduce((s, p) => s + p.amount, 0)
    const pending = payments.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0)
    const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0)

    const byPlan: Record<string, number> = {}
    for (const p of payments.filter(p => p.paid)) {
      byPlan[p.plan] = (byPlan[p.plan] ?? 0) + p.amount
    }

    return {
      received,
      pending,
      total: received + pending,
      expenses: expensesTotal,
      net: received - expensesTotal,
      by_plan: byPlan,
      count: { total: payments.length, paid: payments.filter(p => p.paid).length },
    }
  })

  fastify.get('/history', { onRequest: [authenticateInstructor] }, async (request) => {
    const user = (request as any).user
    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()

      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({ where: { academyId: user.academyId, month: m, year: y } }),
        prisma.expense.findMany({ where: { academyId: user.academyId, month: m, year: y } }),
      ])

      const received = payments.filter(p => p.paid).reduce((s, p) => s + p.amount, 0)
      const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0)

      months.push({ month: m, year: y, received, expenses: expensesTotal, net: received - expensesTotal })
    }

    return { months }
  })
}
