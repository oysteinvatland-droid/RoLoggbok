-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
create type public.boat_status as enum ('available', 'on_water', 'maintenance');

create type public.boat_type as enum (
  '1x', '1x pl', '1xC', '1xTR',
  '2x', '2xC', '2xTR', '2-', '2x/2-',
  '4x/4-', '4x', '4-', '4+', '5x/4x+',
  '8+', 'innr'
);

create type public.member_role     as enum ('rower', 'coach', 'admin');
create type public.age_category    as enum ('J10', 'J12', 'J14', 'J16', 'J18', 'Senior');
create type public.seriousness_type as enum ('recreational', 'competitor');

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── clubs ────────────────────────────────────────────────────────────────────
create table public.clubs (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clubs_updated_at before update on public.clubs
  for each row execute procedure public.set_updated_at();

-- ─── members ──────────────────────────────────────────────────────────────────
create table public.members (
  id           uuid primary key default uuid_generate_v4(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  name         text not null,
  role         public.member_role      not null default 'rower',
  age_category public.age_category     not null default 'Senior',
  seriousness  public.seriousness_type not null default 'recreational',
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index members_club_id_idx    on public.members (club_id);
create index members_active_idx     on public.members (club_id) where archived_at is null;
create trigger members_updated_at before update on public.members
  for each row execute procedure public.set_updated_at();

-- ─── teams ────────────────────────────────────────────────────────────────────
create table public.teams (
  id         uuid primary key default uuid_generate_v4(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index teams_club_id_idx on public.teams (club_id);
create trigger teams_updated_at before update on public.teams
  for each row execute procedure public.set_updated_at();

-- ─── boats ────────────────────────────────────────────────────────────────────
create table public.boats (
  id               uuid primary key default uuid_generate_v4(),
  club_id          uuid not null references public.clubs(id) on delete cascade,
  name             text not null,
  type             public.boat_type   not null default '1x',
  status           public.boat_status not null default 'available',
  boat_number      text,
  min_age_category public.age_category,
  min_seriousness  public.seriousness_type,
  notes            text,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index boats_club_id_idx on public.boats (club_id);
create index boats_status_idx  on public.boats (club_id, status) where archived_at is null;
create trigger boats_updated_at before update on public.boats
  for each row execute procedure public.set_updated_at();

-- ─── routes ───────────────────────────────────────────────────────────────────
create table public.routes (
  id          uuid primary key default uuid_generate_v4(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  name        text not null,
  distance_km numeric(6,2),
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index routes_club_id_idx on public.routes (club_id);
create trigger routes_updated_at before update on public.routes
  for each row execute procedure public.set_updated_at();

-- ─── sessions ─────────────────────────────────────────────────────────────────
create table public.sessions (
  id                 uuid primary key default uuid_generate_v4(),
  club_id            uuid not null references public.clubs(id) on delete cascade,
  boat_id            uuid not null references public.boats(id),
  route_id           uuid references public.routes(id),
  start_time         timestamptz not null,
  estimated_end_time timestamptz,
  end_time           timestamptz,
  comment            text,
  has_been_coached   boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index sessions_club_id_idx  on public.sessions (club_id);
create index sessions_boat_id_idx  on public.sessions (boat_id);
create index sessions_active_idx   on public.sessions (club_id, end_time) where end_time is null;
create index sessions_start_idx    on public.sessions (start_time desc);
create trigger sessions_updated_at before update on public.sessions
  for each row execute procedure public.set_updated_at();

-- ─── session_members ──────────────────────────────────────────────────────────
create table public.session_members (
  session_id uuid not null references public.sessions(id) on delete cascade,
  member_id  uuid not null references public.members(id),
  primary key (session_id, member_id)
);
create index session_members_member_idx on public.session_members (member_id);

-- ─── incidents ────────────────────────────────────────────────────────────────
create table public.incidents (
  id          uuid primary key default uuid_generate_v4(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  session_id  uuid not null references public.sessions(id) on delete cascade,
  boat_id     uuid not null references public.boats(id),
  description text not null,
  occurred_at timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index incidents_club_id_idx    on public.incidents (club_id);
create index incidents_session_id_idx on public.incidents (session_id);
create trigger incidents_updated_at before update on public.incidents
  for each row execute procedure public.set_updated_at();

-- ─── Boat status sync trigger ─────────────────────────────────────────────────
create or replace function public.sync_boat_status()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update public.boats set status = 'on_water'
      where id = new.boat_id and status = 'available';
  elsif (TG_OP = 'UPDATE') then
    if new.end_time is not null and old.end_time is null then
      update public.boats set status = 'available'
        where id = new.boat_id and status = 'on_water';
    end if;
  end if;
  return new;
end;
$$;
create trigger sessions_sync_boat_status
  after insert or update on public.sessions
  for each row execute procedure public.sync_boat_status();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.clubs           enable row level security;
alter table public.members         enable row level security;
alter table public.boats           enable row level security;
alter table public.teams           enable row level security;
alter table public.routes          enable row level security;
alter table public.sessions        enable row level security;
alter table public.session_members enable row level security;
alter table public.incidents       enable row level security;

-- Permissive anon policies for MVP (app always filters by club_id)
do $$
declare
  t text;
begin
  foreach t in array array['clubs','members','boats','teams','routes','sessions','incidents'] loop
    execute format('create policy "anon_select_%s" on public.%s for select to anon using (true)', t, t);
    execute format('create policy "anon_insert_%s" on public.%s for insert to anon with check (true)', t, t);
    execute format('create policy "anon_update_%s" on public.%s for update to anon using (true) with check (true)', t, t);
  end loop;
end $$;

create policy "anon_delete_teams" on public.teams for delete to anon using (true);

create policy "anon_select_session_members" on public.session_members for select to anon using (true);
create policy "anon_insert_session_members" on public.session_members for insert to anon with check (true);

-- ─── Seed: run this separately and copy the UUID to VITE_CLUB_ID ──────────────
-- insert into public.clubs (name) values ('Bærum Roklubb') returning id;
