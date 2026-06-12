import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

export default async function academyRoutes(fastify: FastifyInstance) {
  const authenticate = (fastify as any).authenticate
  const authenticateAdmin = (fastify as any).authenticateAdmin

  fastify.get('/settings', { onRequest: [authenticate] }, async (request, reply) => {
    const { academyId } = (request as any).user

    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: {
        id: true,
        name: true,
        slug: true,
        pixKey: true,
        pixKeyType: true,
        pixRecipientName: true,
        pixBank: true,
      },
    })

    if (!academy) return reply.status(404).send({ error: 'Academy not found' })
    return { academy }
  })

  fastify.patch('/settings', { onRequest: [authenticateAdmin] }, async (request, reply) => {
    const { academyId } = (request as any).user

    const schema = z.object({
      pixKey: z.string().max(140).nullable().optional(),
      pixKeyType: z.enum(['email', 'cpf', 'telefone', 'aleatoria']).nullable().optional(),
      pixRecipientName: z.string().max(80).nullable().optional(),
      pixBank: z.string().max(80).nullable().optional(),
    })

    let body: z.infer<typeof schema>
    try {
      body = schema.parse(request.body)
    } catch (err: any) {
      const msg = err.errors?.[0]?.message ?? 'Dados inválidos'
      return reply.status(400).send({ error: msg })
    }

    const academy = await prisma.academy.update({
      where: { id: academyId },
      data: {
        ...(body.pixKey !== undefined ? { pixKey: body.pixKey } : {}),
        ...(body.pixKeyType !== undefined ? { pixKeyType: body.pixKeyType } : {}),
        ...(body.pixRecipientName !== undefined ? { pixRecipientName: body.pixRecipientName } : {}),
        ...(body.pixBank !== undefined ? { pixBank: body.pixBank } : {}),
      },
      select: { id: true, name: true, pixKey: true, pixKeyType: true, pixRecipientName: true, pixBank: true },
    })

    return { academy }
  })
}
