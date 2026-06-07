import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env'
import { query, one, updateRow } from '../db'
import { requireAuth, requireAdmin } from '../auth'
import { BOAT_TYPE_SELECT } from '../sql'

const COLS = ['name', 'crew_size', 'has_coach', 'filter_id']

const createSchema = z.object({
  name: z.string().min(1),
  crew_size: z.number().int(),
  has_coach: z.boolean().optional(),
  filter_id: z.string().uuid().nullable().optional(),
})

const assignSchema = z.object({
  filterId: z.string().uuid(),
  boatTypeIds: z.array(z.string().uuid()),
  previousBoatTypeIds: z.array(z.string().uuid()),
})

function boatTypeById(id: string, clubId: string) {
  return one(`${BOAT_TYPE_SELECT} where t.id = $1 and t.club_id = $2`, [id, clubId])
}

export async function boatTypeRoutes(app: FastifyInstance) {
  app.get('/boat-types', { preHandler: requireAuth }, async () => {
    return query(`${BOAT_TYPE_SELECT} where t.club_id = $1 order by t.name`, [env.CLUB_ID])
  })

  app.post('/boat-types', { preHandler: requireAdmin }, async (req) => {
    const b = createSchema.parse(req.body)
    const created = await one<{ id: string }>(
      `insert into boat_types (club_id, name, crew_size, has_coach, filter_id)
       values ($1, $2, $3, coalesce($4::boolean, false), $5) returning id`,
      [env.CLUB_ID, b.name, b.crew_size, b.has_coach ?? null, b.filter_id ?? null],
    )
    return boatTypeById(created!.id, env.CLUB_ID)
  })

  app.patch('/boat-types/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    await updateRow('boat_types', COLS, id, env.CLUB_ID, req.body as Record<string, unknown>, 'id')
    return boatTypeById(id, env.CLUB_ID)
  })

  app.delete('/boat-types/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    await query(`delete from boat_types where id = $1 and club_id = $2`, [id, env.CLUB_ID])
    return { ok: true }
  })

  // Tilordner et sett båttyper til et filter (setter/fjerner filter_id i bulk).
  app.post('/boat-types/assign-filter', { preHandler: requireAdmin }, async (req) => {
    const { filterId, boatTypeIds, previousBoatTypeIds } = assignSchema.parse(req.body)
    const toAdd = boatTypeIds.filter((id) => !previousBoatTypeIds.includes(id))
    const toRemove = previousBoatTypeIds.filter((id) => !boatTypeIds.includes(id))
    if (toAdd.length > 0) {
      await query(
        `update boat_types set filter_id = $1 where club_id = $2 and id = any($3::uuid[])`,
        [filterId, env.CLUB_ID, toAdd],
      )
    }
    if (toRemove.length > 0) {
      await query(
        `update boat_types set filter_id = null where club_id = $1 and id = any($2::uuid[])`,
        [env.CLUB_ID, toRemove],
      )
    }
    return { ok: true }
  })
}
