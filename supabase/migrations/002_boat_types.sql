-- ─── boat_types ───────────────────────────────────────────────────────────────
create table public.boat_types (
  id         uuid primary key default uuid_generate_v4(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  name       text not null,
  crew_size  smallint not null check (crew_size between 1 and 8),
  has_coach  boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index boat_types_club_id_idx on public.boat_types (club_id);
create trigger boat_types_updated_at before update on public.boat_types
  for each row execute procedure public.set_updated_at();

alter table public.boat_types enable row level security;
create policy "anon_all" on public.boat_types for all to anon using (true) with check (true);
