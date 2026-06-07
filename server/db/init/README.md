# server/db/init

Alt som ligger her kjøres av Postgres-containeren **én gang**, ved første oppstart av et
tomt datavolum (`docker-entrypoint-initdb.d`).

Hit kommer `001_schema.sql` — en **renset, konsolidert** versjon av
`supabase/migrations/*.sql`:

- beholder tabeller, enums, indekser og triggerne `set_updated_at()` + `sync_boat_status()`
- **fjerner** alt Supabase-spesifikt: `enable row level security`, alle `... to anon`-policyer
  og rolle-grants, samt `pg_cron`/`cron.schedule(...)`

Filen genereres i skjema-/drift-steget (krever Supabase connection string for å diffe mot
live-skjemaet først). Se `MIGRATION-NOTES.md` → «Åpne punkter».
