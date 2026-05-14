-- Update boat team assignments based on club list
-- Format: primary team = team_id, secondary team = secondary_team_id

DO $$
DECLARE
  t_alle        uuid;
  t_aktive      uuid;
  t_ung         uuid;
  t_masters     uuid;
BEGIN
  SELECT id INTO t_alle    FROM teams WHERE name = 'Alle'                  LIMIT 1;
  SELECT id INTO t_aktive  FROM teams WHERE name = 'BR Aktive'             LIMIT 1;
  SELECT id INTO t_ung     FROM teams WHERE name = 'BR Ung'                LIMIT 1;
  SELECT id INTO t_masters FROM teams WHERE name = 'Masters og tidl aktive' LIMIT 1;

  -- Bærums Åtter'n: Masters og tidl aktive (BR Ung)
  UPDATE boats SET team_id = t_masters, secondary_team_id = t_ung
  WHERE name = 'Bærums Åtter''n';

  -- Thor Nilsen: Masters og tidl aktive (BR Ung)
  UPDATE boats SET team_id = t_masters, secondary_team_id = t_ung
  WHERE name = 'Thor Nilsen';

  -- Sandvika: BR Ung (BR Aktive)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_aktive
  WHERE name = 'Sandvika';

  -- Kalvøya: BR Ung (BR Aktive)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_aktive
  WHERE name = 'Kalvøya';

  -- Lis: BR Ung (Mast/Tidl konk)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_masters
  WHERE name = 'Lis';

  -- Bærum: BR Aktive
  UPDATE boats SET team_id = t_aktive, secondary_team_id = NULL
  WHERE name = 'Bærum';

  -- Asker: BR Aktive (BR Ung)
  UPDATE boats SET team_id = t_aktive, secondary_team_id = t_ung
  WHERE name = 'Asker';

  -- Sigrid: BR Ung (BR Aktive)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_aktive
  WHERE name = 'Sigrid';

  -- Rune: BR Ung
  UPDATE boats SET team_id = t_ung, secondary_team_id = NULL
  WHERE name = 'Rune';

  -- Kjell: BR Aktive (BR Ung)
  UPDATE boats SET team_id = t_aktive, secondary_team_id = t_ung
  WHERE name = 'Kjell';

  -- Ingolf: BR Ung (Mast/Tidl konk)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_masters
  WHERE name = 'Ingolf';

  -- Philip: BR Ung (Mast/Tidl konk)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_masters
  WHERE name = 'Philip';

  -- Ole: Masters og tidl aktive (BR Ung)
  UPDATE boats SET team_id = t_masters, secondary_team_id = t_ung
  WHERE name = 'Ole';

  -- Tomas: BR Ung (BR Aktive)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_aktive
  WHERE name = 'Tomas';

  -- Kjetil: BR Ung (BR Aktive)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_aktive
  WHERE name = 'Kjetil';

  -- Eliza: Masters og tidl aktive (BR Ung)
  UPDATE boats SET team_id = t_masters, secondary_team_id = t_ung
  WHERE name = 'Eliza';

  -- Knut: BR Ung (BR Aktive)
  UPDATE boats SET team_id = t_ung, secondary_team_id = t_aktive
  WHERE name = 'Knut';
END $$;
