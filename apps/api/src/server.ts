import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth'
import studentRoutes from './routes/students'
import instructorRoutes from './routes/instructors'
import lessonRoutes from './routes/lessons'
import financeRoutes from './routes/finance'
import evaluationRoutes from './routes/evaluations'
import progressRoutes from './routes/progress'
import checkinRoutes from './routes/checkins'
import feedbackRoutes from './routes/feedbacks'
import sublevelRoutes from './routes/sublevels'
import fichaItemRoutes from './routes/ficha-items'
import intakeRoutes from './routes/intake'
import historyRoutes from './routes/history'
import academyRoutes from './routes/academy'

export const prisma = new PrismaClient()

const server = Fastify({ logger: true })

server.register(cors, {
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
})

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'infinity-fight-secret-change-in-production',
})

server.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

server.decorate('authenticateInstructor', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
    if (request.user.role !== 'INSTRUCTOR' && request.user.role !== 'ADMIN') {
      reply.status(403).send({ error: 'Forbidden — instructor only' })
    }
  } catch {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

server.decorate('authenticateAdmin', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
    if (request.user.role !== 'ADMIN') {
      reply.status(403).send({ error: 'Forbidden — admin only' })
    }
  } catch {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

server.register(authRoutes, { prefix: '/api/v1/auth' })
server.register(studentRoutes, { prefix: '/api/v1/students' })
server.register(instructorRoutes, { prefix: '/api/v1/instructors' })
server.register(lessonRoutes, { prefix: '/api/v1/lessons' })
server.register(financeRoutes, { prefix: '/api/v1/finance' })
server.register(evaluationRoutes, { prefix: '/api/v1/evaluations' })
server.register(progressRoutes, { prefix: '/api/v1/progress' })
server.register(checkinRoutes, { prefix: '/api/v1/checkins' })
server.register(feedbackRoutes, { prefix: '/api/v1/feedbacks' })
server.register(sublevelRoutes, { prefix: '/api/v1/sublevels' })
server.register(fichaItemRoutes, { prefix: '/api/v1/ficha-items' })
server.register(intakeRoutes, { prefix: '/api/v1/intake' })
server.register(historyRoutes, { prefix: '/api/v1/history' })
server.register(academyRoutes, { prefix: '/api/v1/academy' })

server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' })
    console.log('🚀 API running on http://localhost:3001')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
