import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
import { ZodError } from 'zod'
import { env } from './env'
import { authRoutes } from './routes/auth'
import { dashboardRoutes } from './routes/dashboard'
import { boatRoutes } from './routes/boats'
import { memberRoutes } from './routes/members'
import { routeRoutes } from './routes/routes'
import { teamRoutes } from './routes/teams'
import { boatTypeRoutes } from './routes/boatTypes'
import { boatTypeFilterRoutes } from './routes/boatTypeFilters'
import { sessionRoutes } from './routes/sessions'

const app = Fastify({ logger: true, trustProxy: true })

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) {
    return reply.code(400).send({ error: 'Ugyldig forespørsel', issues: err.issues })
  }
  app.log.error(err)
  return reply.code(500).send({ error: 'Serverfeil' })
})

async function main() {
  await app.register(cookie, { secret: env.SESSION_SECRET })

  app.get('/healthz', async () => ({ ok: true }))

  await app.register(
    async (api) => {
      await api.register(authRoutes)
      await api.register(dashboardRoutes)
      await api.register(boatRoutes)
      await api.register(memberRoutes)
      await api.register(routeRoutes)
      await api.register(teamRoutes)
      await api.register(boatTypeRoutes)
      await api.register(boatTypeFilterRoutes)
      await api.register(sessionRoutes)
    },
    { prefix: '/api' },
  )

  // Statiske SPA-filer + fallback til index.html for klient-side ruter.
  await app.register(fastifyStatic, { root: env.STATIC_DIR, wildcard: false })
  app.setNotFoundHandler((req, reply) => {
    if (req.raw.url?.startsWith('/api')) {
      return reply.code(404).send({ error: 'Not found' })
    }
    return reply.sendFile('index.html')
  })

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

main().catch((err) => {
  app.log.error(err)
  process.exit(1)
})
