ALTER TABLE public.boats
  ADD COLUMN secondary_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
