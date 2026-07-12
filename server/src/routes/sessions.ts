import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { env } from '../env'
import { query, one } from '../db'
import { requireAuth, requireAdmin } from '../auth'
import { SESSION_DETAIL_SELECT } from '../sql'

const startSchema = z.object({
  id: z.string().uuid().optional(),
  boat_id: z.string().uuid(),
  member_ids: z.array(z.string().uuid()).default([]),
  route_id: z.string().uuid().nullable().optional(),
  start_time: z.string(),
  estimated_end_time: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
})

const stopSchema = z.object({
  end_time: z.string(),
  has_been_coached: z.boolean().default(false),
  distance_km: z.number().nullable().optional(),
  incident_description: z.string().nullable().optional(),
  boat_id: z.string().uuid(),
})

export async function sessionRoutes(app: FastifyInstance) {
  app.get('/sessions/history', { preHandler: requireAuth }, async () => {
    return query(
      `${SESSION_DETAIL_SELECT}
       where s.club_id = $1 and s.end_time is not null
       order by s.start_time desc limit 200`,
      [env.CLUB_ID],
    )
  })

  // Start tur. Idempotent (klient-UUID) → trygt å replaye fra offline-køen.
  app.post('/sessions', { preHandler: requireAuth }, async (req) => {
    const b = startSchema.parse(req.body)
    const id = b.id ?? randomUUID()

    await query(
      `insert into sessions (id, club_id, boat_id, route_id, start_time, estimated_end_time, comment)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         boat_id = excluded.boat_id,
         route_id = excluded.route_id,
         start_time = excluded.start_time,
         estimated_end_time = excluded.estimated_end_time,
         comment = excluded.comment`,
      [id, env.CLUB_ID, b.boat_id, b.route_id ?? null, b.start_time, b.estimated_end_time ?? null, b.comment ?? null],
    )

    // Rekkefølgen i member_ids er sitteplassen i båten (nr 1, 2, ...).
    for (let i = 0; i < b.member_ids.length; i++) {
      await query(
        `insert into session_members (session_id, member_id, seat_number) values ($1, $2, $3)
         on conflict (session_id, member_id) do update set seat_number = excluded.seat_number`,
        [id, b.member_ids[i], i + 1],
      )
    }

    return one(`select * from sessions where id = $1 and club_id = $2`, [id, env.CLUB_ID])
  })

  // Stopp tur (+ valgfri hendelse).
  app.patch('/sessions/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = req.params as { id: string }
    const b = stopSchema.parse(req.body)

    await query(
      `update sessions set end_time = $1, has_been_coached = $2, distance_km = $3
       where id = $4 and club_id = $5`,
      [b.end_time, b.has_been_coached, b.distance_km ?? null, id, env.CLUB_ID],
    )

    if (b.incident_description) {
      await query(
        `insert into incidents (id, club_id, session_id, boat_id, description, occurred_at)
         values ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), env.CLUB_ID, id, b.boat_id, b.incident_description, b.end_time],
      )
    }

    return { ok: true }
  })

  // Slett tur. session_members og incidents fjernes automatisk (on delete cascade).
  app.delete('/sessions/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await query(`delete from sessions where id = $1 and club_id = $2`, [id, env.CLUB_ID])
    return reply.code(204).send()
  })
}
