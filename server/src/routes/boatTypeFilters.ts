import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env'
import { query, one, updateRow } from '../db'
import { requireAuth, requireAdmin } from '../auth'

const COLS = ['name', 'sort_order']

const createSchema = z.object({
  name: z.string().min(1),
  sort_order: z.number().int(),
})

export async function boatTypeFilterRoutes(app: FastifyInstance) {
  app.get('/boat-type-filters', { preHandler: requireAuth }, async () => {
    return query(
      `select f.*,
         coalesce((
           select json_agg(t order by t.name)
           from boat_types t where t.filter_id = f.id
         ), '[]'::json) as boat_types
       from boat_type_filters f
       where f.club_id = $1
       order by f.sort_order`,
      [env.CLUB_ID],
    )
  })

  app.post('/boat-type-filters', { preHandler: requireAdmin }, async (req) => {
    const b = createSchema.parse(req.body)
    return one(
      `insert into boat_type_filters (club_id, name, sort_order) values ($1, $2, $3) returning *`,
      [env.CLUB_ID, b.name, b.sort_order],
    )
  })

  app.patch('/boat-type-filters/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    return updateRow('boat_type_filters', COLS, id, env.CLUB_ID, req.body as Record<string, unknown>)
  })

  app.delete('/boat-type-filters/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    await query(`delete from boat_type_filters where id = $1 and club_id = $2`, [id, env.CLUB_ID])
    return { ok: true }
  })
}
