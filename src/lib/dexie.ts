import Dexie, { type Table } from 'dexie'
import type { Boat, Member, Route, Session, Incident, QueuedOperation } from '@/types'

interface CachedSessionMember {
  id: string
  session_id: string
  member_id: string
}

class BaatloggDatabase extends Dexie {
  boats!:           Table<Boat, string>
  members!:         Table<Member, string>
  routes!:          Table<Route, string>
  sessions!:        Table<Session, string>
  session_members!: Table<CachedSessionMember, string>
  incidents!:       Table<Incident, string>
  queue!:           Table<QueuedOperation, number>

  constructor() {
    super('baatlogg')
    this.version(1).stores({
      boats:           'id, club_id, status, archived_at',
      members:         'id, club_id, archived_at',
      routes:          'id, club_id, archived_at',
      sessions:        'id, club_id, boat_id, start_time, end_time',
      session_members: 'id, session_id, member_id',
      incidents:       'id, club_id, session_id',
      queue:           '++id, type, created_at',
    })
  }
}

export const db = new BaatloggDatabase()

export function sessionMemberId(session_id: string, member_id: string) {
  return `${session_id}::${member_id}`
}
