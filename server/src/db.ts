import { Pool } from 'pg'
import { env } from './env'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
})

/** Kjør spørring, returner alle rader. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

/** Kjør spørring, returner første rad eller null. */
export async function one<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

/**
 * Generisk, parametrisert UPDATE på utvalgte (kode-kontrollerte) kolonner.
 * `table`/`allowed`/`returning` settes av oss, aldri av klienten → ingen SQL-injection.
 */
export async function updateRow<T = Record<string, unknown>>(
  table: string,
  allowed: string[],
  id: string,
  clubId: string,
  body: Record<string, unknown>,
  returning = '*',
): Promise<T | null> {
  const keys = Object.keys(body).filter((k) => allowed.includes(k))
  if (keys.length === 0) {
    return one<T>(`select ${returning} from ${table} where id = $1 and club_id = $2`, [id, clubId])
  }
  const sets = keys.map((k, i) => `${k} = $${i + 3}`).join(', ')
  const values = keys.map((k) => body[k])
  return one<T>(
    `update ${table} set ${sets} where id = $1 and club_id = $2 returning ${returning}`,
    [id, clubId, ...values],
  )
}
