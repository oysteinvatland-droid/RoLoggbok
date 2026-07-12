-- Sitteplass i båten for hver roer på en tur (nr 1, 2, ...).
-- Nullbar: turer registrert før denne endringen har ingen lagret plassering.
alter table public.session_members
  add column if not exists seat_number integer;
