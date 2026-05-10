-- Add 'away' status for boats on trip or regatta
alter type public.boat_status add value 'away';

-- Date when the boat is expected to return (null = unknown)
alter table public.boats add column available_from date;

-- Enable pg_cron extension (built-in on Supabase)
create extension if not exists pg_cron;

-- Daily job at 06:00 UTC: reset boats whose return date has passed
select cron.schedule(
  'reset-away-boats',
  '0 6 * * *',
  $$
    update public.boats
    set status = 'available', available_from = null
    where status = 'away'
      and available_from is not null
      and available_from <= current_date;
  $$
);
