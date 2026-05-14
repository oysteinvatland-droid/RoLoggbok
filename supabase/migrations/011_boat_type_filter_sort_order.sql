alter table public.boat_type_filters
  add column sort_order integer not null default 0;

update public.boat_type_filters set sort_order = 1 where name = 'Singelsculler 1x';
update public.boat_type_filters set sort_order = 2 where name = 'Dobbeltsculler/Toer 2x/2-';
update public.boat_type_filters set sort_order = 3 where name = 'Dobbeltfirer/Firer 4x/4-';
update public.boat_type_filters set sort_order = 4 where name = 'Åtter 8+';
update public.boat_type_filters set sort_order = 5 where name = 'Coastal';
update public.boat_type_filters set sort_order = 6 where name = 'Tur og mosjon';
