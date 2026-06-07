import type { Page, Route } from '@playwright/test'

// Mocker det nye backend-API-et (/api/*) som erstattet direkte Supabase-tilgang.
// Testene kjører mot vite dev-serveren; det finnes ingen backend, så alt avskjæres her.

const MEMBER_1 = {
  id: 'm-001',
  club_id: 'test-club',
  name: 'Kari Nordmann',
  role: 'rower',
  age_category: 'Senior',
  seriousness: 'recreational',
  archived_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const BOAT_TYPE = {
  id: 'bt-001',
  club_id: 'test-club',
  name: 'Singelsculler (1x)',
  crew_size: 1,
  has_coach: false,
  filter_id: null,
  filter: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const BOAT_BASE = {
  id: 'b-001',
  club_id: 'test-club',
  name: 'Testbåt',
  boat_type_id: 'bt-001',
  boat_type: BOAT_TYPE,
  status: 'available',
  boat_number: null,
  team_id: null,
  secondary_team_id: null,
  team: null,
  secondary_team: null,
  min_age_category: null,
  min_seriousness: null,
  notes: null,
  available_from: null,
  archived_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// SessionWithDetails — formen /api/dashboard og /api/sessions/history returnerer.
function activeSession(startTime: string) {
  return {
    id: 's-001',
    club_id: 'test-club',
    boat_id: 'b-001',
    route_id: null,
    start_time: startTime,
    estimated_end_time: null,
    end_time: null,
    comment: null,
    has_been_coached: false,
    distance_km: null,
    created_at: startTime,
    updated_at: startTime,
    boat: { ...BOAT_BASE, status: 'on_water' },
    route: null,
    members: [MEMBER_1],
    incident: null,
  }
}

// Plain Session — formen POST /api/sessions returnerer.
function sessionRow(startTime: string) {
  return {
    id: 's-001',
    club_id: 'test-club',
    boat_id: 'b-001',
    route_id: null,
    start_time: startTime,
    estimated_end_time: null,
    end_time: null,
    comment: null,
    has_been_coached: false,
    distance_km: null,
    created_at: startTime,
    updated_at: startTime,
  }
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

interface MockOptions {
  authenticated?: boolean // GET /api/session → authenticated
  admin?: boolean // GET /api/session → admin
  started?: boolean // dashboard-båten er på vannet
  loginUsername?: string // hvis satt: POST /api/login validerer mot disse
  loginPassword?: string
  adminPin?: string // hvis satt: POST /api/admin/verify validerer mot denne
}

function installApiRoutes(page: Page, opts: MockOptions) {
  let started = opts.started ?? false
  const authenticated = opts.authenticated ?? true
  const admin = opts.admin ?? true
  const startedAt = new Date(Date.now() - 30 * 60_000).toISOString()

  return page.route('**/api/**', async (route) => {
    const { pathname } = new URL(route.request().url())
    const method = route.request().method()

    // ── Auth ──
    if (pathname === '/api/session') return json(route, { authenticated, admin })

    if (pathname === '/api/login' && method === 'POST') {
      if (opts.loginPassword === undefined) return json(route, { ok: true })
      const body = (route.request().postDataJSON() ?? {}) as { username?: string; password?: string }
      const ok = body.username === opts.loginUsername && body.password === opts.loginPassword
      return ok ? json(route, { ok: true }) : json(route, { error: 'Feil brukernavn eller passord' }, 401)
    }

    if (pathname === '/api/admin/verify' && method === 'POST') {
      if (opts.adminPin === undefined) return json(route, { ok: true })
      const body = (route.request().postDataJSON() ?? {}) as { pin?: string }
      return body.pin === opts.adminPin ? json(route, { ok: true }) : json(route, { error: 'Feil PIN' }, 401)
    }

    if (pathname === '/api/logout') return json(route, { ok: true })

    // ── Skriv ──
    if (pathname === '/api/sessions' && method === 'POST') {
      started = true
      return json(route, sessionRow(new Date().toISOString()), 201)
    }
    if (pathname.startsWith('/api/sessions/') && method === 'PATCH') {
      started = false
      return json(route, { ok: true })
    }

    // ── Les ──
    if (pathname === '/api/dashboard') {
      const boat = {
        ...BOAT_BASE,
        status: started ? 'on_water' : 'available',
        active_session: started ? activeSession(startedAt) : null,
      }
      return json(route, [boat])
    }
    if (pathname === '/api/members') return json(route, [MEMBER_1])
    if (pathname === '/api/sessions/history') return json(route, [])

    // routes/teams/boat-types/boat-type-filters/boats → tomt
    return json(route, [])
  })
}

export function setupDashboardMocks(page: Page) {
  return installApiRoutes(page, { started: false })
}

export function setupOnWaterMocks(page: Page) {
  return installApiRoutes(page, { started: true })
}

// Login-skjerm: ikke innlogget, og /api/login validerer mot oppgitte credentials.
export function setupLoginMocks(page: Page, username: string, password: string) {
  return installApiRoutes(page, { authenticated: false, admin: false, loginUsername: username, loginPassword: password })
}

// Innlogget app, men admin-PIN ikke verifisert ennå; /api/admin/verify validerer mot pin.
export function setupAdminPinMocks(page: Page, pin: string) {
  return installApiRoutes(page, { authenticated: true, admin: false, adminPin: pin })
}
