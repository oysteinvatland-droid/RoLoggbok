import type { FastifyReply, FastifyRequest } from 'fastify'
import { env, isProd } from './env'

const SESSION_COOKIE = 'bl_session'
const ADMIN_COOKIE = 'bl_admin'

/**
 * Session-cookie uten Max-Age → slettes når nettleseren lukkes (speiler dagens
 * sessionStorage-kiosk-oppførsel). httpOnly = ikke lesbar fra JS. Signert via SESSION_SECRET.
 */
const cookieOptions = {
  httpOnly: true,
  secure: isProd, // settes som Secure i prod (bak nginx TLS); av i dev over http
  sameSite: 'strict' as const,
  path: '/',
  signed: true,
}

export function setSessionCookie(reply: FastifyReply) {
  reply.setCookie(SESSION_COOKIE, 'ok', cookieOptions)
}

export function setAdminCookie(reply: FastifyReply) {
  reply.setCookie(ADMIN_COOKIE, 'ok', cookieOptions)
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
  reply.clearCookie(ADMIN_COOKIE, { path: '/' })
}

function cookieValid(req: FastifyRequest, name: string): boolean {
  const raw = req.cookies[name]
  if (!raw) return false
  const unsigned = req.unsignCookie(raw)
  return unsigned.valid && unsigned.value === 'ok'
}

export function isAuthenticated(req: FastifyRequest): boolean {
  return cookieValid(req, SESSION_COOKIE)
}

export function isAdmin(req: FastifyRequest): boolean {
  return cookieValid(req, ADMIN_COOKIE)
}

/** preHandler: krever gyldig login-cookie. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!isAuthenticated(req)) {
    return reply.code(401).send({ error: 'Ikke innlogget' })
  }
}

/** preHandler: krever login + verifisert admin-PIN. */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (!isAuthenticated(req)) {
    return reply.code(401).send({ error: 'Ikke innlogget' })
  }
  if (!isAdmin(req)) {
    return reply.code(403).send({ error: 'Krever admin' })
  }
}

export { env }
