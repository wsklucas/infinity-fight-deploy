import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

export default async function instructorRoutes(fastify: FastifyInstance) {
  const authenticateInstructor = (fastify as any).authenticateInstructor

  fastify.post('/', { onRequest: [authenticateInstructor] }, async (request, reply) => {
    const user = (request as any).user
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    })
    const { name, email, password } = schema.parse(request.body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return reply.status(409).send({ error: 'Email already registered' })

    const bcrypt = await import('bcryptjs')
    const hashed = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        academyId: user.academyId,
        name,
        email,
        password: hashed,
        role: 'INSTRUCTOR',
      },
    })

    return reply.status(201).send({
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    })
  })
}
