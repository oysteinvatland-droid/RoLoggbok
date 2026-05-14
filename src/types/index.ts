// ─── Enum string unions ───────────────────────────────────────────────────────

export type BoatStatus = 'available' | 'on_water' | 'maintenance' | 'away'

export type MemberRole = 'rower' | 'coach' | 'admin'
export type AgeCategory = 'J10' | 'J12' | 'J14' | 'J16' | 'J18' | 'Senior'
export type SeriousnessType = 'recreational' | 'competitor'

// ─── Database row types ───────────────────────────────────────────────────────

export interface Club {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  club_id: string
  name: string
  role: MemberRole
  age_category: AgeCategory
  seriousness: SeriousnessType
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  club_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface BoatTypeFilter {
  id: string
  club_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BoatKind {
  id: string
  club_id: string
  name: string
  crew_size: number
  has_coach: boolean
  filter_id: string | null
  filter: BoatTypeFilter | null
  created_at: string
  updated_at: string
}

export interface Boat {
  id: string
  club_id: string
  name: string
  boat_type_id: string
  boat_type: BoatKind | null
  status: BoatStatus
  boat_number: string | null
  team_id: string | null
  secondary_team_id: string | null
  team: Team | null
  secondary_team: Team | null
  min_age_category: AgeCategory | null
  min_seriousness: SeriousnessType | null
  notes: string | null
  available_from: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  club_id: string
  name: string
  distance_km: number | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  club_id: string
  boat_id: string
  route_id: string | null
  start_time: string
  estimated_end_time: string | null
  end_time: string | null
  comment: string | null
  has_been_coached: boolean
  distance_km: number | null
  created_at: string
  updated_at: string
}

export interface SessionMember {
  session_id: string
  member_id: string
}

export interface Incident {
  id: string
  club_id: string
  session_id: string
  boat_id: string
  description: string
  occurred_at: string
  created_at: string
  updated_at: string
}

// ─── Composite types ──────────────────────────────────────────────────────────

export interface SessionWithDetails extends Session {
  boat: Boat
  route: Route | null
  members: Member[]
  incident: Incident | null
}

export interface BoatWithActiveSession extends Boat {
  active_session: SessionWithDetails | null
}

// ─── Form input types ─────────────────────────────────────────────────────────

export interface StartSessionInput {
  boat_id: string
  member_ids: string[]
  route_id: string | null
  start_time: string
  estimated_end_time: string | null
  comment: string
}

export interface StopSessionInput {
  session_id: string
  end_time: string
  has_been_coached: boolean
  incident_description: string | null
  boat_id: string
  distance_km: number | null
}

// ─── Offline queue ────────────────────────────────────────────────────────────

export type QueueOperationType =
  | 'START_SESSION'
  | 'STOP_SESSION'

export interface QueuedOperation {
  id?: number
  type: QueueOperationType
  payload: unknown
  created_at: string
  retry_count: number
  last_error: string | null
}
