# Båtlogg

Digital loggbok for bruk av båter i Bærum Roklubb — en PWA som erstatter den analoge papirboken i båthuset.

## Funksjonalitet

- **Kiosk-dashboard**: Oversikt over alle båter — tilgjengelige, på vannet og til vedlikehold
- **Start tur**: Velg båt, roere, rute og tidspunkt via en enkel veiviser
- **Avslutt tur**: Registrer sluttid, om turen var coachet, og eventuelle hendelser/skader
- **Offline-støtte**: Appen fungerer uten nett — registreringer synkroniseres automatisk når nettforbindelsen er tilbake
- **Admin** (PIN-beskyttet): CRUD for roere, båter og ruter; loggbok med søk og CSV-eksport

## Teknologi

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Supabase (PostgreSQL + Row Level Security)
- Dexie.js (IndexedDB — offline-kø og lokal cache)
- vite-plugin-pwa (Workbox service worker)
- TanStack Query v5

## Oppsett

### 1. Klon og installer

```bash
git clone <repo-url>
cd RoLoggbok
npm install
```

### 2. Opprett Supabase-prosjekt

1. Gå til [supabase.com](https://supabase.com) og opprett et nytt prosjekt
2. Kjør migrasjonen i Supabase SQL-editoren:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Kjør seed-kommandoen og noter UUID-en:
   ```sql
   INSERT INTO public.clubs (name) VALUES ('Bærum Roklubb') RETURNING id;
   ```

### 3. Miljøvariabler

```bash
cp .env.example .env
```

Fyll inn i `.env`:

```
VITE_SUPABASE_URL=https://ditt-prosjekt.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-nøkkel
VITE_CLUB_ID=uuid-fra-steg-2
VITE_ADMIN_PIN=1234
```

### 4. Start utviklingsserver

```bash
npm run dev
```

### 5. Deploy til Vercel

```bash
npm run build
vercel deploy
```

Sett miljøvariablene i Vercel-dashbordet. `vercel.json` håndterer SPA-routing automatisk.

## iPad-installasjon (kiosk-modus)

1. Åpne appen i Safari på iPad
2. Trykk på Del-ikonet → "Legg til på hjemskjerm"
3. Appen åpnes i fullskjerm uten nettlesergrensesnitt

## Kreditt

Funksjonalitet og UX-mønstre er inspirert av [RowingBeacon](https://github.com/MathisBarre/logbook.rowingbeacon.com) av Mathis Barré (CC BY-NC-SA 4.0). Ingen kode er kopiert — dette er en ny applikasjon med annen arkitektur (PWA/Supabase vs. desktop/Tauri/SQLite).
