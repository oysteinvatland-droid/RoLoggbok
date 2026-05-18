import type { Page } from '@playwright/test'

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
  sort_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const BOAT_BASE = {
  id: 'b-001',
  club_id: 'test-club',
  name: 'Testbåt',
  boat_type_id: 'bt-001',
  boat_type: BOAT_TYPE,
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

function makeSession(startTime: string) {
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
    boats: { ...BOAT_BASE, status: 'on_water' },
    routes: null,
    session_members: [{ member_id: 'm-001', members: MEMBER_1 }],
    incidents: [],
  }
}

function getTable(url: string): string {
  const match = url.match(/\/rest\/v1\/([^?/]+)/)
  return match?.[1] ?? ''
}

export async function setupDashboardMocks(page: Page) {
  let sessionStarted = false
  const sessionStartTime = new Date(Date.now() - 30 * 60_000).toISOString()

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    const table = getTable(url)

    if (table === 'boats') {
      const boat = { ...BOAT_BASE, status: sessionStarted ? 'on_water' : 'available' }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([boat]) })

    } else if (table === 'session_members') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: '[]' })

    } else if (table === 'sessions') {
      if (method === 'POST') {
        sessionStarted = true
        const session = makeSession(new Date().toISOString())
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([session]) })
      } else if (method === 'PATCH') {
        sessionStarted = false
        await route.fulfill({ status: 204, body: '' })
      } else {
        const body = sessionStarted ? JSON.stringify([makeSession(sessionStartTime)]) : '[]'
        await route.fulfill({ status: 200, contentType: 'application/json', body })
      }

    } else if (table === 'members') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MEMBER_1]) })

    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
  })
}

export async function setupOnWaterMocks(page: Page) {
  let sessionStarted = true
  const sessionStartTime = new Date(Date.now() - 30 * 60_000).toISOString()

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    const table = getTable(url)

    if (table === 'boats') {
      const boat = { ...BOAT_BASE, status: sessionStarted ? 'on_water' : 'available' }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([boat]) })

    } else if (table === 'session_members') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: '[]' })

    } else if (table === 'sessions') {
      if (method === 'PATCH') {
        sessionStarted = false
        await route.fulfill({ status: 204, body: '' })
      } else {
        const body = sessionStarted ? JSON.stringify([makeSession(sessionStartTime)]) : '[]'
        await route.fulfill({ status: 200, contentType: 'application/json', body })
      }

    } else if (table === 'members') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MEMBER_1]) })

    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
  })
}
