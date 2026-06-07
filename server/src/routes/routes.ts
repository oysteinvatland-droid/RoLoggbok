import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env'
import { query, one, updateRow } from '../db'
import { requireAuth, requireAdmin } from '../auth'

const COLS = ['name', 'distance_km', 'archived_at']

const createSchema = z.object({
  name: z.string().min(1),
  distance_km: z.number().nullable().optional(),
  archived_at: z.string().nullable().optional(),
})

export async function routeRoutes(app: FastifyInstance) {
  app.get('/routes', { preHandler: requireAuth }, async () => {
    return query(
      `select * from routes where club_id = $1 and archived_at is null order by name`,
      [env.CLUB_ID],
    )
  })

  app.post('/routes', { preHandler: requireAdmin }, async (req) => {
    const b = createSchema.parse(req.body)
    return one(
      `insert into routes (club_id, name, distance_km) values ($1, $2, $3) returning *`,
      [env.CLUB_ID, b.name, b.distance_km ?? null],
    )
  })

  app.patch('/routes/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    return updateRow('routes', COLS, id, env.CLUB_ID, req.body as Record<string, unknown>)
  })
}
