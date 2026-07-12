import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../env'
import { query, one, updateRow } from '../db'
import { requireAuth, requireAdmin } from '../auth'
import { BOAT_SELECT } from '../sql'

const COLS = [
  'name', 'boat_type_id', 'status', 'boat_number', 'team_id', 'secondary_team_id',
  'min_age_category', 'min_seriousness', 'notes', 'available_from', 'archived_at',
]

const createSchema = z.object({
  name: z.string().min(1),
  boat_type_id: z.string().uuid(),
  status: z.string().optional(),
  boat_number: z.string().nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
  secondary_team_id: z.string().uuid().nullable().optional(),
  min_age_category: z.string().nullable().optional(),
  min_seriousness: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  available_from: z.string().nullable().optional(),
})

function boatById(id: string, clubId: string) {
  return one(`${BOAT_SELECT} where b.id = $1 and b.club_id = $2`, [id, clubId])
}

export async function boatRoutes(app: FastifyInstance) {
  app.get('/boats', { preHandler: requireAuth }, async (req) => {
    const scope = (req.query as { scope?: string }).scope
    const activeOnly = scope !== 'all'
    return query(
      `${BOAT_SELECT} where b.club_id = $1 ${activeOnly ? 'and b.archived_at is null' : ''} order by b.name`,
      [env.CLUB_ID],
    )
  })

  // Roere som har brukt denne båten før, sortert med sist brukt øverst.
  app.get('/boats/:id/rowers', { preHandler: requireAuth }, async (req) => {
    const { id } = req.params as { id: string }
    return query(
      `select m.*, max(s.start_time) as last_used
       from members m
       join session_members sm on sm.member_id = m.id
       join sessions s on s.id = sm.session_id
       where s.club_id = $1 and s.boat_id = $2 and m.archived_at is null
       group by m.id
       order by max(s.start_time) desc`,
      [env.CLUB_ID, id],
    )
  })

  app.post('/boats', { preHandler: requireAdmin }, async (req) => {
    const b = createSchema.parse(req.body)
    const created = await one<{ id: string }>(
      `insert into boats
         (club_id, name, boat_type_id, status, boat_number, team_id, secondary_team_id,
          min_age_category, min_seriousness, notes, available_from)
       values ($1, $2, $3, coalesce($4::boat_status, 'available'), $5, $6, $7, $8, $9, $10, $11)
       returning id`,
      [
        env.CLUB_ID, b.name, b.boat_type_id, b.status ?? null, b.boat_number ?? null,
        b.team_id ?? null, b.secondary_team_id ?? null, b.min_age_category ?? null,
        b.min_seriousness ?? null, b.notes ?? null, b.available_from ?? null,
      ],
    )
    return boatById(created!.id, env.CLUB_ID)
  })

  app.patch('/boats/:id', { preHandler: requireAdmin }, async (req) => {
    const { id } = req.params as { id: string }
    await updateRow('boats', COLS, id, env.CLUB_ID, req.body as Record<string, unknown>, 'id')
    return boatById(id, env.CLUB_ID)
  })
}
