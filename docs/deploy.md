# Deploy — Båtlogg på Hetzner

Runbook for å sette opp `https://br.protokoll.fplanalyse.no` på serveren. Speiler
FikenTjeneste-mønsteret: app + db i Docker Compose, app bundet til `127.0.0.1:3001`,
nginx reverse proxy + Let's Encrypt foran.

> Nedetid er uproblematisk (appen er i test). **Behold Vercel-deployet** til den nye
> kjører stabilt — det er rollback-en din.

---

## 0. Forutsetninger på serveren

```bash
# Docker + Compose-plugin (om ikke allerede installert)
docker --version && docker compose version

# Postgres-klient v16 (for skjema-dump + datamigrering)
sudo apt-get update && sudo apt-get install -y postgresql-client-16 python3

# nginx + certbot (om ikke allerede installert)
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Du trenger også:
- **Supabase connection string** (fra Supabase → Project Settings → Database → Connection string, "URI"). Brukes kun under migrering, aldri lagret i appen.
- **Server-IP** til DNS.

---

## 1. DNS

Opprett en **A-record**: `br.protokoll.fplanalyse.no` → serverens offentlige IP.
Verifiser før du fortsetter:

```bash
dig +short br.protokoll.fplanalyse.no   # skal vise server-IP-en
```

---

## 2. Hent koden

```bash
git clone <repo-url> baatlogg && cd baatlogg
```

---

## 3. Lag `.env`

```bash
cp .env.example .env
# Generer en sterk session-hemmelighet:
echo "SESSION_SECRET=$(openssl rand -hex 32)"
nano .env   # fyll inn CLUB_ID, APP_PASSWORD, ADMIN_PIN, SESSION_SECRET, POSTGRES_PASSWORD
```

- `CLUB_ID` = samme UUID som dagens `VITE_CLUB_ID` (clubs-raden).
- `APP_PASSWORD` / `ADMIN_PIN` = klubbpassord + admin-PIN (nå ekte server-hemmeligheter).
- `POSTGRES_PASSWORD` = fritt valgt; compose bygger `DATABASE_URL` av den med `host=db`.

`.env` er gitignorert og skal aldri committes.

---

## 4. Generer skjemaet fra live Supabase

> Migrasjonsfilene har drift (kolonner/seed lagt til i dashbordet). Derfor hentes
> skjemaet fra den levende databasen og renses for RLS/pg_cron/anon. Se `MIGRATION-NOTES.md`.

```bash
SUPABASE_DB_URL='postgres://...' bash scripts/generate-schema.sh
```

Dette skriver `server/db/init/001_schema.sql`. **Les gjennom** fila og listen over
droppede statements (på stderr) — alt som droppes skal være RLS/pg_cron/rolle-relatert.
Sjekk spesielt at `uuid-ossp`-extensionen er beholdt i `public`.

---

## 5. Bygg og start (oppretter skjemaet)

```bash
bash scripts/deploy.sh
```

Ved første oppstart av et tomt datavolum kjører Postgres `server/db/init/001_schema.sql`.
Skriptet bygger image-ene, starter `app` + `db`, og verifiserer
`http://127.0.0.1:3001/healthz`.

---

## 6. Migrer dataene

```bash
SUPABASE_DB_URL='postgres://...' bash scripts/migrate-data.sh
```

Dumper **kun data** (ikke skjema) fra Supabase og restorer i db-containeren via
`docker compose exec` (databasen eksponeres aldri). Skriptet skriver ut radtelling
per tabell før/etter og **stopper med feil hvis noe avviker**.

---

## 7. Nginx + TLS

```bash
# Legg vhosten på plass (forén gjerne med FikenTjeneste-malen først)
sudo cp deploy/nginx/br.protokoll.fplanalyse.no.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/br.protokoll.fplanalyse.no.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Hent sertifikat + sett opp HTTPS-redirect automatisk
sudo certbot --nginx -d br.protokoll.fplanalyse.no
```

---

## 8. `reset-away-boats` (erstatter pg_cron-jobben)

`pg_cron` finnes ikke i `postgres:16-alpine`. Appen nullstiller riktignok "away"-båter
klient-side ved lasting, men legg inn en host-cron som backstopp (kl. 06:00):

```bash
crontab -e
# Lim inn (juster sti):
0 6 * * * cd /home/<bruker>/baatlogg && docker compose -f docker-compose.prod.yml exec -T db \
  psql -U baatlogg -d baatlogg -c "update boats set status='available', available_from=null where status='away' and available_from is not null and available_from <= current_date;" >/dev/null 2>&1
```

---

## 9. Verifiser utenfra

```bash
curl -I https://br.protokoll.fplanalyse.no            # 200, gyldig TLS
```

I nettleseren: logg inn med klubbpassord, sjekk at båter/roere/turer vises, og at
admin-PIN gir tilgang til admin. Bekreft i nettverksfanen at det **kun** går kall til
`br.protokoll.fplanalyse.no` (ingen `*.supabase.co` eller `vercel`).

---

## Oppdateringer senere

```bash
bash scripts/deploy.sh   # git pull + rebuild + restart + healthcheck
```

**Skjemaendringer etter første oppstart** kjøres IKKE av init-mappen (den gjelder kun
tom database). Kjør slike manuelt:

```bash
docker compose -f docker-compose.prod.yml exec -T db psql -U baatlogg -d baatlogg < endring.sql
```

## Rollback

Den nye stacken er isolert. Får du problemer: Vercel-deployet kjører fortsatt mot
Supabase. Pek kiosken tilbake dit til saken er løst. På serveren:
`docker compose -f docker-compose.prod.yml down` stopper alt (datavolumet beholdes).
