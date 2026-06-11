import { FastifyInstance } from 'fastify'
import { prisma } from '../server'
import { FICHAS, EMPTY_FICHA } from '../lib/fichas'

export default async function sublevelRoutes(fastify: FastifyInstance) {
  const authenticate = (fastify as any).authenticate

  fastify.get('/', { onRequest: [authenticate] }, async () => {
    const sublevels = await prisma.sublevel.findMany({
      include: { criteria: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    })
    return { sublevels }
  })

  fastify.get('/:id', { onRequest: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any

    const sublevel = await prisma.sublevel.findUnique({
      where: { id },
      include: { criteria: { orderBy: { order: 'asc' } } },
    })

    if (!sublevel) return reply.status(404).send({ error: 'Sublevel not found' })
    return { sublevel }
  })

  fastify.get('/:id/ficha', { onRequest: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any

    const sublevel = await prisma.sublevel.findUnique({
      where: { id },
      include: { criteria: { orderBy: { order: 'asc' } } },
    })

    if (!sublevel) return reply.status(404).send({ error: 'Sublevel not found' })

    const content = FICHAS[id] ?? EMPTY_FICHA

    return {
      ficha: {
        id: sublevel.id,
        level: sublevel.level,
        label: sublevel.label,
        description: sublevel.description,
        tecnicas: content.tecnicas,
        drills: content.drills,
        jogos: content.jogos,
        criteria: sublevel.criteria,
      },
    }
  })
}
