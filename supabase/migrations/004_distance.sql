-- Add distance_km to sessions (nullable — older sessions have no distance)
ALTER TABLE sessions ADD COLUMN distance_km numeric(7,2);
