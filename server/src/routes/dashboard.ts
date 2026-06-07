import type { FastifyInstance } from 'fastify'
import { env } from '../env'
import { query } from '../db'
import { requireAuth } from '../auth'
import { BOAT_SELECT, SESSION_DETAIL_SELECT } from '../sql'

interface BoatRow { id: string; name: string; [k: string]: unknown }
interface SessionRow { boat_id: string; [k: string]: unknown }

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', { preHandler: requireAuth }, async () => {
    // Nullstill 'away'-båter som skulle vært tilbake (samme som pg_cron-jobben +
    // dagens klient-side fallback — gjør kiosken korrekt fra midnatt).
    await query(
      `update boats set status = 'available', available_from = null
       where club_id = $1 and status = 'away'
         and available_from is not null and available_from <= current_date`,
      [env.CLUB_ID],
    )

    const [boats, sessions, usage] = await Promise.all([
      query<BoatRow>(
        `${BOAT_SELECT} where b.club_id = $1 and b.archived_at is null order by b.name`,
        [env.CLUB_ID],
      ),
      query<SessionRow>(
        `${SESSION_DETAIL_SELECT} where s.club_id = $1 and s.end_time is null`,
        [env.CLUB_ID],
      ),
      query<{ boat_id: string; n: number }>(
        `select boat_id, count(*)::int as n from sessions
         where club_id = $1 and end_time is not null and start_time >= now() - interval '30 days'
         group by boat_id`,
        [env.CLUB_ID],
      ),
    ])

    const usageCounts = new Map(usage.map((u) => [u.boat_id, u.n]))
    boats.sort((a, b) => {
      const diff = (usageCounts.get(b.id) ?? 0) - (usageCounts.get(a.id) ?? 0)
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'nb')
    })

    return boats.map((boat) => ({
      ...boat,
      active_session: sessions.find((s) => s.boat_id === boat.id) ?? null,
    }))
  })
}
