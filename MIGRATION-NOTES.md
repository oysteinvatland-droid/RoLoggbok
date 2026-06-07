# MIGRATION-NOTES — Vercel/Supabase → Hetzner

Status: **kartlegging ferdig, bygging i gang.** Målarkitektur besluttet (se «Beslutninger»).
Ny offentlig URL: `https://br.protokoll.fplanalyse.no`.

---

## Oppgave 0 — funn

### 1. Stack
Ren statisk **Vite + React 19 SPA** (TypeScript). Ingen Node-runtime i dag — bygges til
statiske filer og hostes som static på Vercel. Ingen server-side kode finnes.

### 2. Supabase-bruk → **Scenario (B)**
Frontend snakker **direkte** med Supabase via `@supabase/supabase-js` med anon-nøkkel.
Tilgangsstyring hviler på RLS med permissive anon-policyer (alle kan lese/skrive med
anon-nøkkelen). Ingen backend.

DB-tilgang er fullstendig isolert i **6 filer** (ingen skjerm importerer `supabase` direkte):

| Fil | Ansvar |
|---|---|
| `src/lib/supabase.ts` | `createClient`, `CLUB_ID` |
| `src/lib/sync.ts` | offline-kø: `START_SESSION` / `STOP_SESSION` replay (idempotente upserts) |
| `src/hooks/useBoats.ts` | dashboard, båter, ruter, teams, båttyper (les + skriv) |
| `src/hooks/useMembers.ts` | medlemmer (les + skriv) |
| `src/hooks/useSessions.ts` | turhistorikk + start/stopp-mutasjoner |
| `src/hooks/useBoatTypeFilters.ts` | båttype-filtre (les + skriv) |

Lesene bruker **nøstede PostgREST-joins** (f.eks. `sessions` med `boats`, `routes`,
`session_members→members`, `incidents` i ett kall; `boats` med `boat_types`, `teams`).
→ backend trenger sammensatte lese-endepunkter som gjør joinene server-side.

### 3. «Felles klubbpassord»-innlogging
**Ikke** Supabase Auth (`auth: { persistSession: false }`). To klient-side sjekker:
- `useAppAuth.ts` — brukernavn+passord mot `VITE_APP_USERNAME` / `VITE_APP_PASSWORD`,
  lagrer et flagg i `sessionStorage` (nullstilles ved fanelukking — bevisst kiosk-oppførsel).
- `useAdminPin.ts` — admin-PIN mot `VITE_ADMIN_PIN`, også `sessionStorage`.

Begge ligger i klartekst i JS-bundelen i dag (statisk SPA → ingen ekte hemmelighet).

### 4. Miljøvariabler appen leser (alle `VITE_`-prefikset = offentlige i dagens bundel)

| Variabel | Brukes i | Skjebne i ny arkitektur |
|---|---|---|
| `VITE_SUPABASE_URL` | `lib/supabase.ts` | **fjernes** |
| `VITE_SUPABASE_ANON_KEY` | `lib/supabase.ts` | **fjernes** |
| `VITE_CLUB_ID` | `lib/supabase.ts` | flyttes til server (`CLUB_ID`) |
| `VITE_APP_USERNAME` | `useAppAuth.ts` | server (`APP_USERNAME`) |
| `VITE_APP_PASSWORD` | `useAppAuth.ts` | server (`APP_PASSWORD`) — ekte hemmelighet |
| `VITE_ADMIN_PIN` | `useAdminPin.ts` | server (`ADMIN_PIN`) — ekte hemmelighet |

> Antakelsen «trolig bare DATABASE_URL + klubbpassord» stemte ikke: det finnes ingen
> `DATABASE_URL` i dag, og passordet er ikke en hemmelighet i dagens oppsett.

### 5. Database-skjema (10 tabeller)
`clubs`, `members`, `teams`, `boats`, `routes`, `sessions`, `session_members`,
`incidents`, `boat_types`, `boat_type_filters`.

Alle har `id UUID PK`, `club_id FK` (unntatt `clubs`/`session_members`), `created_at`,
`updated_at`. **RLS aktivert** på alle, med permissive anon-policyer.

Skjemaet har utviklet seg over 11 migrasjoner (001→011) — bl.a. `boat_types`-tabell,
`boats.boat_type_id` (erstattet enum-kolonnen `type`), `team_id`/`secondary_team_id`,
`available_from` + `away`-status, `boat_type_filters`, `distance_km` på `routes`/`sessions`.

**Server-side logikk som må følge med (alt ren PL/pgSQL — portabelt):**
- `set_updated_at()` trigger på alle tabeller.
- `sync_boat_status()` trigger: setter `boats.status='on_water'` ved session-INSERT,
  `'available'` når `end_time` settes. **Frontend rører aldri boat-status manuelt.**

**Supabase-spesifikt som IKKE er portabelt (krever tiltak):**
- RLS-policyer + `to anon`-grants → refererer Supabase-rollen `anon`. **Droppes.**
- `pg_cron`-extension + jobben `reset-away-boats` (`0 6 * * *`, migrasjon 003) →
  finnes ikke i `postgres:16-alpine`. **Må replikeres** (host-cron, se `docs/deploy.md`).

**⚠ BEKREFTET SKJEMA-DRIFT — migrasjonsfilene er IKKE komplett kilde:**
Flere strukturendringer + seed-data finnes kun i live-databasen (laget i dashbordet):
- `boats.boat_type_id` legges aldri til i migrasjonene (005 *bruker* den)
- `boats.team_id` legges aldri til (009 bruker den; 008 la kun til `secondary_team_id`)
- gamle `boats.type`-enumen droppes aldri
- `boat_types`-radene seedes aldri (005 oppdaterer dem per hardkodet UUID)
- `teams`- og `boats`-radene seedes aldri (009 slår dem opp på navn)

→ Skjemaet kan **ikke** håndskrives fra migrasjonene. Det genereres fra live via
`scripts/generate-schema.sh` (`pg_dump --schema-only` + rensing). Krever connection string.

---

## Beslutninger (fra grilling)

1. **Backend-modell:** tynn egen **Fastify**-API foran Postgres. Klubbpassord sjekkes
   server-side; ingen anon-nøkkel i nettleseren.
2. **DB-tilgang:** rå SQL via `node-postgres` (`pg`), ingen ORM.
3. **Frontend:** river ut `@supabase/supabase-js`; `lib/supabase.ts` erstattes av typet
   fetch-klient; de 6 filene skrives om. Offline-køen (`sync.ts`) bevares — skrive-
   endepunkter tar klient-generert UUID for idempotente upserts.
4. **Servering:** én Node-container på `127.0.0.1:3001` serverer både `dist/` (SPA) og
   `/api/*`. Nginx proxyer alt dit (speiler FikenTjeneste).
5. **Auth:** `POST /api/login` → httpOnly, Secure, SameSite=Strict session-cookie uten
   Max-Age (slettes ved fanelukking), signert med `SESSION_SECRET`. Alle `/api/*` krever den.
6. **Admin-PIN:** `POST /api/admin/verify` sjekker PIN server-side, setter admin-flagg i
   sesjonen; admin-/skrive-endepunkter gates på flagget.
7. **Skjema-kilde:** ~~drift-sjekk først~~ → **drift bekreftet** (se over). Skjemaet
   genereres fra live Supabase med `scripts/generate-schema.sh` (`pg_dump --schema-only`
   → `clean-schema.py` fjerner RLS/anon/pg_cron) → `server/db/init/001_schema.sql`. RLS
   droppes, `club_id`-filtrering håndheves i API-et. **Blokkert på connection string.**
8. **Dataflytting:** `scripts/migrate-data.sh` kjøres **på serveren**: `pg_dump --data-only`
   fra Supabase → `docker compose exec -T db psql`. DB forblir ueksponert. Radtelling per
   tabell før/etter.

---

## Planlagt API-flate (utledet fra de 6 filene)

Auth: `POST /api/login`, `POST /api/logout`, `GET /api/session`, `POST /api/admin/verify`.

Les (krever login-cookie):
- `GET /api/dashboard` → `BoatWithActiveSession[]` (båter + aktive turer + 30-dagers bruk)
- `GET /api/boats?scope=active|all`, `GET /api/routes`, `GET /api/members?scope=active|all`
- `GET /api/teams`, `GET /api/boat-types`, `GET /api/boat-type-filters`
- `GET /api/sessions/history` (`end_time` satt, limit 200, nøstede detaljer)

Skriv (krever login; admin-flagg der relevant):
- `POST /api/sessions` (start, idempotent upsert + members), `PATCH /api/sessions/:id` (stopp + evt. incident)
- `POST|PATCH /api/boats`, bulk `PATCH /api/boat-types` (filter-tilordning)
- `POST|PATCH /api/members`, `POST|PATCH /api/routes`
- `POST|PATCH|DELETE /api/teams`, `/api/boat-types`, `/api/boat-type-filters`

Kun `START_SESSION`/`STOP_SESSION` går via offline-køen → de to må være idempotente
(`INSERT ... ON CONFLICT (id) DO UPDATE`, `session_members ON CONFLICT DO NOTHING`).

---

## Status: ✅ DEPLOYET OG VERIFISERT (2026-06-07)

Live på **https://br.protokoll.fplanalyse.no** (Hetzner, ved siden av FikenTjeneste).
Alle akseptansekriterier oppfylt: gyldig TLS, klubbpassord-login virker, all data synlig
(radtelling stemmer: 165 roere, 58 båter, 28 turer …), ingen kall til Vercel/Supabase fra
kjørende app, app+db i Docker med mem_limit, db uten offentlig port.

**Faktiske detaljer:**
- Server-bruker `fiken`, app på `127.0.0.1:3001`, nginx-vhost `/etc/nginx/sites-available/baatlogg.conf`.
- db = `postgres:17-alpine` (Supabase kjører 17.6 — måtte matche).
- Kode på server i `~/baatlogg` (overført med scp-tarball; **ikke** git ennå).

**Lærdommer / fallgruver som ble løst underveis:**
- Supabase **direkte-tilkobling er IPv6-only** → Hetzner har ikke IPv6. Brukte **session
  pooler** (IPv4): `postgres.<ref>@aws-1-eu-north-1.pooler.supabase.com:5432`.
- pg_dump krever **samme/nyere major** som server (17.6) → pg-verktøy + db = pg17.
- Dumpen bruker `extensions.uuid_generate_v4()` (Supabase-skjema) → byttet til kjerne-
  `gen_random_uuid()` i `clean-schema.py`.
- Dumpen har `CREATE SCHEMA public;` → feiler i ren Postgres → droppes i `clean-schema.py`.
- `vite-plugin-pwa@1.2.0` har utdatert peer-range (vite ≤7) → `npm ci --legacy-peer-deps`.
- Host har ingen `psql` → alle pg-verktøy kjøres via `docker run --rm postgres:17-alpine`.

**Gjenstår (ikke blokkerende):**
- [ ] **E2E-tester** (`e2e/*`, `helpers/supabaseMock.ts`) — utdatert, mocker fortsatt
      Supabase. Må skrives om til `/api/*`.
- [ ] **Git:** koden er på server via scp, ikke klonet fra GitHub. Endringene er ucommittet
      lokalt. Bør committes/pushes for at `scripts/deploy.sh` (git pull) skal virke ved oppdatering.
- [ ] **Vercel/Supabase** beholdes som rollback til den nye er bekreftet stabil i bruk.

## Det brukeren leverer (per steg)
- Supabase connection string (drift-sjekk + dataflytting)
- nginx-malen fra FikenTjeneste
- server-IP (DNS A-record) + kjører kommandoene i `docs/deploy.md`
- env-verdier: `APP_PASSWORD`, `ADMIN_PIN`, `SESSION_SECRET`, `CLUB_ID`
