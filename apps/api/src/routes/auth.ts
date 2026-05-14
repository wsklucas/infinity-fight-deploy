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
}
