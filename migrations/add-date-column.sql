-- Add date column to schedules table
ALTER TABLE public.schedules ADD COLUMN date DATE;

-- Make date column NOT NULL after we've updated the data
-- ALTER TABLE public.schedules ALTER COLUMN date SET NOT NULL;
