-- Ny tabell for båttype-filtere
create table public.boat_type_filters (
  id         uuid primary key default uuid_generate_v4(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.boat_type_filters(club_id);

alter table public.boat_type_filters enable row level security;
create policy "anon full access" on public.boat_type_filters
  for all to anon using (true) with check (true);

create trigger set_updated_at_boat_type_filters
  before update on public.boat_type_filters
  for each row execute function public.set_updated_at();

-- FK på boat_types → filter
alter table public.boat_types
  add column filter_id uuid references public.boat_type_filters(id) on delete set null;

-- Seed: opprett de 6 filtrene og koble båttyper
do $$
declare
  f_atter       uuid;
  f_dobbelfirer uuid;
  f_dobbeltoer  uuid;
  f_singel      uuid;
  f_coastal     uuid;
  f_tur         uuid;
  v_club_id     uuid;
begin
  select id into v_club_id from clubs limit 1;

  insert into boat_type_filters (club_id, name) values (v_club_id, 'Åtter 8+')                   returning id into f_atter;
  insert into boat_type_filters (club_id, name) values (v_club_id, 'Dobbeltfirer/Firer 4x/4-')   returning id into f_dobbelfirer;
  insert into boat_type_filters (club_id, name) values (v_club_id, 'Dobbeltsculler/Toer 2x/2-')  returning id into f_dobbeltoer;
  insert into boat_type_filters (club_id, name) values (v_club_id, 'Singelsculler 1x')            returning id into f_singel;
  insert into boat_type_filters (club_id, name) values (v_club_id, 'Coastal')                     returning id into f_coastal;
  insert into boat_type_filters (club_id, name) values (v_club_id, 'Tur og mosjon')               returning id into f_tur;

  update boat_types set filter_id = f_atter       where club_id = v_club_id and name = 'Åtter (8+)';
  update boat_types set filter_id = f_dobbelfirer  where club_id = v_club_id and name = 'Dobbeltfirer/Firer (4x/4-)';
  update boat_types set filter_id = f_dobbeltoer   where club_id = v_club_id and name in ('Dobbeltsculler/Toer (2x/2-)', 'Dobbeltsculler (2x)', 'Toer (2-)');
  update boat_types set filter_id = f_singel       where club_id = v_club_id and name in ('Singelsculler (1x)', 'Singelsculler plast (1x pl)');
  update boat_types set filter_id = f_coastal      where club_id = v_club_id and name in ('Coastal Dobbel (C2x)', 'Coastal Singel (C1x)');
  update boat_types set filter_id = f_tur          where club_id = v_club_id and name in ('Trekvart Dobbeltfirer (4x+)', 'Trekvart Firer (4+)', 'Trimmer Dobbel (2x)', 'Trimmer Singel (1x)', 'Innrigger Toer (2+)');
end $$;
