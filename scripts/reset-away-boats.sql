-- Nullstiller "away"-båter hvis forventet returdato er passert.
-- Erstatter Supabase pg_cron-jobben (migrasjon 003). Kjøres av host-cron kl. 06:00.
-- Appen gjør samme reset klient-side ved lasting; dette er backstoppen.
update boats
set status = 'available', available_from = null
where status = 'away'
  and available_from is not null
  and available_from <= current_date;
