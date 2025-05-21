-- Migration to add date field to schedules table
ALTER TABLE public.schedules 
ADD COLUMN date DATE;

-- Update existing records to have today's date
UPDATE public.schedules
SET date = CURRENT_DATE;

-- Make the date column non-nullable after populating it
ALTER TABLE public.schedules 
ALTER COLUMN date SET NOT NULL;

-- Create index for faster date-based queries
CREATE INDEX schedules_date_idx ON public.schedules(date);

-- Create index for combined user_id and date queries
CREATE INDEX schedules_user_date_idx ON public.schedules(user_id, date);
