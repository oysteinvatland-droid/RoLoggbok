# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Båtlogg** — a PWA replacing the paper boat logbook at Bærum Roklubb (a Norwegian rowing club). An iPad kiosk app backed by Supabase. All UI text is Norwegian (bokmål).

Reference app analyzed for UX/data-model inspiration: [RowingBeacon](https://github.com/MathisBarre/logbook.rowingbeacon.com) (credited in README, no code copied).

## Commands

```bash
npm run dev        # Vite dev server (hot reload)
npm run build      # tsc -b && vite build
npm run preview    # Preview production build locally
npm run lint       # ESLint
```

There is no test runner configured yet. When adding tests, use **Vitest** (already compatible with Vite).

## Architecture

### Tech stack
- **React 19 + TypeScript** via Vite 8
- **Tailwind CSS v4** — configured via `@tailwindcss/vite` plugin (no `tailwind.config.ts` file needed). Custom tokens live in `src/index.css` under `@theme { }`.
- **Supabase JS client** — no Supabase Auth (anon key only for MVP). `VITE_CLUB_ID` scopes every query to one club.
- **TanStack Query v5** — `networkMode: 'offlineFirst'` on all queries/mutations.
- **Dexie.js** — IndexedDB for (a) local mirror of boats/members/sessions and (b) an offline write queue.
- **vite-plugin-pwa** — Workbox service worker precaches all static assets; Supabase API calls use NetworkFirst with 5s timeout.
- **React Router v6** — SPA routing; `vercel.json` rewrites everything to `/`.

### Path alias
`@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Environment variables (see `.env.example`)
| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key (no auth) |
| `VITE_CLUB_ID` | UUID of the club row — added to every DB query |
| `VITE_ADMIN_PIN` | 4-digit PIN for admin section (stored in `sessionStorage`) |

### Planned source structure (target state)
```
src/
  types/index.ts            — all TS interfaces and string-union enum types
  constants/index.ts        — Norwegian display labels, BOAT_TYPE_CREW_SIZE, AGE_CATEGORY_ORDER
  lib/
    supabase.ts             — createClient(), exports CLUB_ID
    dexie.ts                — IndexedDB schema: cache tables + queue table
    sync.ts                 — enqueue(), flushQueue(), processOperation()
  hooks/
    useOnlineStatus.ts      — wraps navigator.onLine + online/offline events
    useOfflineQueue.ts      — addToQueue(), auto-flush on reconnect
    useBoats.ts             — useDashboardData() merges boats + active sessions
    useMembers.ts
    useSessions.ts          — useStartSession(), useStopSession() mutations
    useAdminPin.ts          — sessionStorage PIN auth
  components/
    ui/                     — Button, Input, Select, Badge, Modal, Toast
    layout/StatusBar.tsx    — clock, online/offline badge, pending queue count, admin link
  screens/
    Dashboard/              — boat grid: available (green) | on_water (blue) | maintenance (gray)
    Session/StartSession.tsx — 4-step wizard: rowers → route → time → review
    Session/StopSession.tsx  — end time, coached toggle, optional incident
    Admin/                  — PIN-gated: Members, Boats, Routes, Logbook (CSV export)
```

### Database (Supabase)
Migration lives in `supabase/migrations/001_initial_schema.sql` (to be created).

**Tables:** `clubs`, `members`, `boats`, `routes`, `sessions`, `session_members`, `incidents` — all with `id UUID PK`, `club_id UUID FK`, `created_at`, `updated_at`.

**Key enums:** `boat_status` (available/on_water/maintenance), `boat_type` (7 variants), `member_role`, `age_category` (J10–Senior), `seriousness_type`.

**Trigger:** `sync_boat_status()` automatically sets `boats.status = 'on_water'` on session INSERT and `'available'` when `end_time` is set — the frontend does **not** manually update boat status.

**RLS:** Enabled on all tables; MVP policies are permissive anon (app enforces `club_id` filter). Tighten later.

### Offline write queue pattern
1. Every write operation is assigned a UUID before hitting the network (idempotent upsert).
2. If offline → write optimistic state to Dexie + push `QueuedOperation` to `queue` table.
3. On `online` event → `flushQueue()` processes in insertion order, retries up to 5×, then dead-letters.
4. `StatusBar` shows "Frakoblet ●" + pending count from `db.queue.count()`.

### Admin auth
`useAdminPin` compares entered PIN against `VITE_ADMIN_PIN`. Auth state lives in `sessionStorage` (resets on tab close — intentional for kiosk security). All `/admin/*` routes are wrapped in an `AdminGate` component.

### Design conventions
- **Language:** Norwegian bokmål throughout — labels come from `constants/index.ts`, never hardcoded in components.
- **Touch targets:** minimum 48px, kiosk buttons 64px (`size="xl"` on `Button`).
- **Status colours:** green = available, blue = on_water, gray = maintenance, amber = overdue (past estimated end time).
- **Skill level system** (`age_category`, `seriousness`) exists in the DB schema but is **not validated in v1**. Deferred to v2.
- **Statistics screen** is deferred to v2.
