import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../server'

export default async function fichaItemRoutes(fastify: FastifyInstance) {
  const authenticateAdmin = (fastify as any).authenticateAdmin

  const categoryEnum = z.enum(['TECNICA', 'DRILL_FIXACAO', 'JOGO_TATICO'])

  // POST / — create item
  fastify.post('/', { onRequest: [authenticateAdmin] }, async (request, reply) => {
    const schema = z.object({
      sublevelId: z.string(),
      category: categoryEnum,
      title: z.string().min(1),
      description: z.string().optional(),
    })
    const body = schema.parse(request.body)
    const user = (request as any).user

    const maxOrder = await prisma.fichaItem.findFirst({
      where: { sublevelId: body.sublevelId, academyId: user.academyId, category: body.category },
      orderBy: { order: 'desc' },
    })

    const item = await prisma.fichaItem.create({
      data: {
        academyId: user.academyId,
        sublevelId: body.sublevelId,
        category: body.category,
        title: body.title,
        description: body.description ?? null,
        order: (maxOrder?.order ?? 0) + 1,
      },
    })

    return reply.status(201).send({ item })
  })

  // PATCH /reorder — must come BEFORE /:id to avoid route conflict
  fastify.patch('/reorder', { onRequest: [authenticateAdmin] }, async (request, reply) => {
    const schema = z.object({ ids: z.array(z.string().uuid()) })
    const { ids } = schema.parse(request.body)

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.fichaItem.update({ where: { id }, data: { order: index + 1 } })
      )
    )

    return { ok: true }
  })

  // PATCH /:id — edit item (also handles move: changing sublevelId)
  fastify.patch('/:id', { onRequest: [authenticateAdmin] }, async (request, reply) => {
    const { id } = request.params as any
    const schema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      category: categoryEnum.optional(),
      sublevelId: z.string().optional(),
    })
    const body = schema.parse(request.body)
    const user = (request as any).user

    // If moving to a different sublevel, append at end of target
    let order: number | undefined
    if (body.sublevelId) {
      const existing = await prisma.fichaItem.findUnique({ where: { id } })
      if (existing && existing.sublevelId !== body.sublevelId) {
        const maxOrder = await prisma.fichaItem.findFirst({
          where: { sublevelId: body.sublevelId, academyId: user.academyId },
          orderBy: { order: 'desc' },
        })
        order = (maxOrder?.order ?? 0) + 1
      }
    }

    const item = await prisma.fichaItem.update({
      where: { id },
      data: { ...body, ...(order !== undefined ? { order } : {}) },
    })

    return { item }
  })

  // PATCH /:id/duplicate — copy to another sublevel
  fastify.patch('/:id/duplicate', { onRequest: [authenticateAdmin] }, async (request, reply) => {
    const { id } = request.params as any
    const schema = z.object({ targetSublevelId: z.string() })
    const { targetSublevelId } = schema.parse(request.body)

    const source = await prisma.fichaItem.findUnique({ where: { id } })
    if (!source) return reply.status(404).send({ error: 'Item not found' })

    const maxOrder = await prisma.fichaItem.findFirst({
      where: { sublevelId: targetSublevelId, academyId: source.academyId, category: source.category },
      orderBy: { order: 'desc' },
    })

    const item = await prisma.fichaItem.create({
      data: {
        academyId: source.academyId,
        sublevelId: targetSublevelId,
        category: source.category,
        title: source.title,
        description: source.description,
        order: (maxOrder?.order ?? 0) + 1,
      },
    })

    return reply.status(201).send({ item })
  })

  // DELETE /:id
  fastify.delete('/:id', { onRequest: [authenticateAdmin] }, async (request, reply) => {
    const { id } = request.params as any
    await prisma.fichaItem.delete({ where: { id } })
    return reply.status(204).send()
  })
}
