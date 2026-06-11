import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../server'

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })
    const { email, password } = schema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { email },
      include: { academy: true },
    })

    if (!user || !user.active) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const accessToken = fastify.jwt.sign(
      { id: user.id, role: user.role, academyId: user.academyId },
      { expiresIn: '15m' }
    )

    const refreshToken = fastify.jwt.sign(
      { id: user.id, type: 'refresh' },
      { expiresIn: '7d' }
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt },
    })

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        academy: user.academy.name,
        mustChangePassword: user.mustChangePassword,
      },
    }
  })

  fastify.post('/refresh', async (request, reply) => {
    const schema = z.object({ refresh_token: z.string() })
    const { refresh_token } = schema.parse(request.body)

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refresh_token },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' })
    }

    const accessToken = fastify.jwt.sign(
      { id: stored.user.id, role: stored.user.role, academyId: stored.user.academyId },
      { expiresIn: '15m' }
    )

    return { access_token: accessToken }
  })

  fastify.post('/logout', { onRequest: [(fastify as any).authenticate] }, async (request, reply) => {
    const schema = z.object({ refresh_token: z.string() })
    const { refresh_token } = schema.parse(request.body)
    await prisma.refreshToken.deleteMany({ where: { token: refresh_token } })
    return { success: true }
  })

  fastify.patch('/first-password', { onRequest: [(fastify as any).authenticate] }, async (request, reply) => {
    const schema = z.object({
      newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    })
    let body: { newPassword: string }
    try {
      body = schema.parse(request.body)
    } catch (err: any) {
      const msg = err.errors?.[0]?.message ?? 'Dados inválidos'
      return reply.status(400).send({ error: msg })
    }
    const { id } = (request as any).user
    const hash = await bcrypt.hash(body.newPassword, 10)
    await prisma.user.update({ where: { id }, data: { password: hash, mustChangePassword: false } })
    return { success: true }
  })

  fastify.patch('/password', { onRequest: [(fastify as any).authenticate] }, async (request, reply) => {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    })

    let body: { currentPassword: string; newPassword: string }
    try {
      body = schema.parse(request.body)
    } catch (err: any) {
      const msg = err.errors?.[0]?.message ?? 'Dados inválidos'
      return reply.status(400).send({ error: msg })
    }

    const { id } = (request as any).user
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return reply.status(404).send({ error: 'Usuário não encontrado' })

    const valid = await bcrypt.compare(body.currentPassword, user.password)
    if (!valid) return reply.status(400).send({ error: 'Senha atual incorreta' })

    const hash = await bcrypt.hash(body.newPassword, 10)
    await prisma.user.update({ where: { id }, data: { password: hash } })

    return { success: true }
  })
}
