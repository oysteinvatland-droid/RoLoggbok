-- Oppdater båttyper til offisiell NRF-terminologi
-- Flytt båter fra de to slettede typene til Dobbeltfirer/Firer (4x/4-)
UPDATE public.boats
  SET boat_type_id = '77f786b3-37ad-41bc-b9c3-101566409a62'
  WHERE boat_type_id IN (
    '8194ba6d-bcc7-4ea0-b3b6-4db2826de9d7',  -- Dobbel firer scull (4x)
    '6523517c-94e2-4a64-b93a-335ee0122a81'   -- Firer uten styrmann (4-)
  );

-- Slett de to overflødige typene
DELETE FROM public.boat_types
  WHERE id IN (
    '8194ba6d-bcc7-4ea0-b3b6-4db2826de9d7',
    '6523517c-94e2-4a64-b93a-335ee0122a81'
  );

-- Oppdater navn, has_coach og sort_order
UPDATE public.boat_types SET name = 'Singelsculler (1x)',           sort_order = 6  WHERE id = '1f8593cc-6334-4281-9722-9cbf2a5ece69';
UPDATE public.boat_types SET name = 'Singelsculler plast (1x pl)',  sort_order = 5  WHERE id = 'f83316b5-6d27-450f-9e70-62c6bb075528';
UPDATE public.boat_types SET name = 'Coastal Singel (C1x)',         sort_order = 8  WHERE id = '0147a1f2-e7eb-4159-9f8c-e7c800a75186';
UPDATE public.boat_types SET name = 'Trimmer Singel (1x)',          sort_order = 12 WHERE id = '2f335aa8-b5a4-402c-86ee-660dc6a9b0c7';
UPDATE public.boat_types SET                                         sort_order = 3  WHERE id = '999c45f9-ceee-4c88-9c31-02816ea0ea2d';
UPDATE public.boat_types SET name = 'Coastal Dobbel (C2x)',         sort_order = 7  WHERE id = 'f7824309-03dc-44f0-964b-12e38ffeb38c';
UPDATE public.boat_types SET name = 'Trimmer Dobbel (2x)',          sort_order = 11 WHERE id = '75f7c310-514d-4486-86ab-3141df66be5d';
UPDATE public.boat_types SET name = 'Toer (2-)',                    sort_order = 4  WHERE id = 'eb3f7413-e287-418b-ad3b-ded0a70854a0';
UPDATE public.boat_types SET name = 'Dobbeltsculler/Toer (2x/2-)', sort_order = 2  WHERE id = '1ac1cfc9-7260-4f46-aa52-bf227f29c6e3';
UPDATE public.boat_types SET name = 'Dobbeltfirer/Firer (4x/4-)', sort_order = 1  WHERE id = '77f786b3-37ad-41bc-b9c3-101566409a62';
UPDATE public.boat_types SET name = 'Trekvart Firer (4+)',          sort_order = 10, has_coach = true WHERE id = 'c5861a85-2949-4603-b157-ff9173de5341';
UPDATE public.boat_types SET name = 'Trekvart Dobbeltfirer (4x+)', sort_order = 9,  has_coach = true WHERE id = 'f186e464-1c2c-4c3d-844d-3562befe8d8d';
UPDATE public.boat_types SET name = 'Åtter (8+)',                   sort_order = 0  WHERE id = '85ccb7d3-7c19-40cf-b894-7d4fe83d3175';
UPDATE public.boat_types SET name = 'Innrigger Toer (2+)',          sort_order = 13, crew_size = 2, has_coach = true WHERE id = '523e0a37-acf9-4d1f-be66-234b959a1f36';
