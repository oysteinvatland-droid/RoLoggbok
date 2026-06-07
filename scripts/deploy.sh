#!/usr/bin/env bash
# Deployer / oppdaterer Båtlogg på serveren. Kjør fra repo-roten.
#
#   bash scripts/deploy.sh
#
# Skjemaet opprettes automatisk fra server/db/init/ ved FØRSTE oppstart av et tomt
# datavolum. Senere skjemaendringer må kjøres manuelt (se docs/deploy.md).
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> git pull"
git pull --ff-only

echo "==> Bygger og starter app + db"
$COMPOSE up -d --build

echo "==> Venter på healthcheck (127.0.0.1:3001/healthz)..."
ok=""
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3001/healthz >/dev/null 2>&1; then
    echo "   OK etter ${i} forsøk"
    ok=1
    break
  fi
  sleep 2
done

if [ -z "$ok" ]; then
  echo "==> ⚠ Healthcheck feilet. Siste app-logg:"
  $COMPOSE logs --tail=50 app
  exit 1
fi

echo "==> Deploy ferdig → https://br.protokoll.fplanalyse.no"
