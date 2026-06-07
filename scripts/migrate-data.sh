#!/usr/bin/env bash
# Migrerer DATA (ikke skjema) fra Supabase til db-containeren.
#
# Forutsetninger:
#   - Kjøres PÅ SERVEREN, fra repo-roten.
#   - app + db er allerede oppe (docker compose -f docker-compose.prod.yml up -d),
#     dvs. skjemaet er allerede opprettet fra server/db/init/001_schema.sql.
#   - pg-verktøyene kjøres via en throwaway postgres:16-container (host har ikke psql).
#
# Bruk:
#   SUPABASE_DB_URL='postgres://...' bash scripts/migrate-data.sh
set -euo pipefail

: "${SUPABASE_DB_URL:?Sett SUPABASE_DB_URL til Supabase connection string}"

COMPOSE="docker compose -f docker-compose.prod.yml"
PGIMAGE="postgres:17-alpine"

# Rekkefølge etter FK-avhengighet (kun for telling — restoren ordner selv rekkefølgen).
TABLES=(clubs teams members boat_type_filters boat_types boats routes sessions session_members incidents)

# Kjør psql mot Supabase (kilde) i en throwaway-container.
src_psql() {
  docker run --rm -e PGURL="$SUPABASE_DB_URL" -e Q="$1" "$PGIMAGE" \
    sh -c 'psql "$PGURL" -tAc "$Q"' | tr -d '[:space:]'
}
# Kjør psql mot db-containeren (mål).
dst_psql() { $COMPOSE exec -T db psql -U baatlogg -d baatlogg -tAc "$1" | tr -d '[:space:]'; }

echo "==> Radtelling FØR (Supabase = kilde):"
declare -A before
for t in "${TABLES[@]}"; do
  before[$t]=$(src_psql "select count(*) from public.$t")
  printf '   %-20s %s\n' "$t" "${before[$t]}"
done

echo "==> Dumper data fra Supabase → restorer i db-containeren..."
docker run --rm -e PGURL="$SUPABASE_DB_URL" "$PGIMAGE" \
  sh -c 'pg_dump "$PGURL" --data-only --schema=public --no-owner --disable-triggers' \
  | $COMPOSE exec -T db psql -U baatlogg -d baatlogg -v ON_ERROR_STOP=1 -q

echo "==> Radtelling ETTER (ny database = mål) — sammenlign:"
ok=1
for t in "${TABLES[@]}"; do
  after=$(dst_psql "select count(*) from public.$t")
  flag=""
  if [ "$after" != "${before[$t]}" ]; then flag="  ⚠ AVVIK (var ${before[$t]})"; ok=0; fi
  printf '   %-20s %s%s\n' "$t" "$after" "$flag"
done

if [ "$ok" = 1 ]; then
  echo "==> OK: alle radtellinger stemmer."
else
  echo "==> ⚠ Minst én tabell har avvik — undersøk før du går videre."
  exit 1
fi
