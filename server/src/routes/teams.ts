import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env'
import { query, one, updateRow } from '../db'
import { requireAuth, requireAdmin } from '../auth'

const COLS = ['name']
const createSchema = z.object({ name: z.string().min(1) })

export async function teamRoutes(app: FastifyInstance) {
  app.get('/teams', { preHandler: requireAuth }, async () => {
    return query(`select * from teams where club_id = $1 order by name`, [env.CLUB_ID])
  })

  app.post('/teams', { preHandler: requireAdmin }, async (req) => {
    const b = createSchema.parse(req.body)
    return one(`insert into teams (club_id, name) values ($1, $2) returning *`, [env.CLUB_ID, b.name])
  })

  app.patch('/teams/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    return updateRow('teams', COLS, id, env.CLUB_ID, req.body as Record<string, unknown>)
  })

  app.delete('/teams/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    await query(`delete from teams where id = $1 and club_id = $2`, [id, env.CLUB_ID])
    return { ok: true }
  })
}
