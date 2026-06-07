import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env'
import { query, one, updateRow } from '../db'
import { requireAuth, requireAdmin } from '../auth'

const COLS = ['name', 'role', 'age_category', 'seriousness', 'archived_at']

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  age_category: z.string().optional(),
  seriousness: z.string().optional(),
  archived_at: z.string().nullable().optional(),
})

export async function memberRoutes(app: FastifyInstance) {
  app.get('/members', { preHandler: requireAuth }, async (req) => {
    const scope = (req.query as { scope?: string }).scope
    const activeOnly = scope !== 'all'
    return query(
      `select * from members where club_id = $1 ${activeOnly ? 'and archived_at is null' : ''} order by name`,
      [env.CLUB_ID],
    )
  })

  app.post('/members', { preHandler: requireAdmin }, async (req) => {
    const b = createSchema.parse(req.body)
    return one(
      `insert into members (club_id, name, role, age_category, seriousness)
       values ($1, $2, coalesce($3::member_role, 'rower'),
               coalesce($4::age_category, 'Senior'), coalesce($5::seriousness_type, 'recreational'))
       returning *`,
      [env.CLUB_ID, b.name, b.role ?? null, b.age_category ?? null, b.seriousness ?? null],
    )
  })

  app.patch('/members/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    return updateRow('members', COLS, id, env.CLUB_ID, req.body as Record<string, unknown>)
  })
}
