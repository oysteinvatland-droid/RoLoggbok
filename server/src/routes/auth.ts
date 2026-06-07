import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  env,
  setSessionCookie,
  setAdminCookie,
  clearAuthCookies,
  isAuthenticated,
  isAdmin,
  requireAuth,
} from '../auth'

const loginSchema = z.object({ username: z.string(), password: z.string() })
const pinSchema = z.object({ pin: z.string() })

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const { username, password } = loginSchema.parse(req.body)
    if (username !== env.APP_USERNAME || password !== env.APP_PASSWORD) {
      return reply.code(401).send({ error: 'Feil brukernavn eller passord' })
    }
    setSessionCookie(reply)
    return { ok: true }
  })

  app.post('/logout', async (_req, reply) => {
    clearAuthCookies(reply)
    return { ok: true }
  })

  app.get('/session', async (req) => ({
    authenticated: isAuthenticated(req),
    admin: isAdmin(req),
  }))

  app.post('/admin/verify', { preHandler: requireAuth }, async (req, reply) => {
    const { pin } = pinSchema.parse(req.body)
    if (pin !== env.ADMIN_PIN) return reply.code(401).send({ error: 'Feil PIN' })
    setAdminCookie(reply)
    return { ok: true }
  })
}
