#!/usr/bin/env bash
# Genererer server/db/init/001_schema.sql fra den LEVENDE Supabase-databasen.
#
# Hvorfor fra live og ikke fra migrasjonsfilene: skjemaet har drift (kolonner og
# seed-data lagt til via Supabase-dashbordet som aldri havnet i migrasjonene), så
# migrasjonsfilene er ikke en komplett kilde. Live-skjemaet er fasit.
#
# pg-verktøyene kjøres via en throwaway postgres:16-container (host har ikke psql).
# Krever: docker + python3.
#
# Bruk:
#   SUPABASE_DB_URL='postgres://...' bash scripts/generate-schema.sh
set -euo pipefail

: "${SUPABASE_DB_URL:?Sett SUPABASE_DB_URL til Supabase connection string}"

HERE="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$HERE/server/db/init/001_schema.sql"
PGIMAGE="postgres:17-alpine"

echo "==> Dumper public-skjemaet fra Supabase (via $PGIMAGE, kun struktur)..."
docker run --rm -e PGURL="$SUPABASE_DB_URL" "$PGIMAGE" \
  sh -c 'pg_dump "$PGURL" --schema=public --schema-only --no-owner --no-privileges --no-comments' \
  | python3 "$HERE/scripts/clean-schema.py" > "$OUT"

echo "==> Skrev $OUT ($(wc -l < "$OUT") linjer)."
echo "==> VIKTIG: les gjennom fila og stderr-listen over droppede statements."
echo "    Sjekk at uuid-ossp-extensionen er beholdt i public, og at ingen"
echo "    referanser til 'extensions.'-skjemaet står igjen."
