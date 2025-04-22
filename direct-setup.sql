-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.schedules;
DROP TABLE IF EXISTS public.users;

-- Create users table
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  initial TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create schedules table
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES public.users(id),
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  label TEXT NOT NULL,
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX schedules_user_id_idx ON public.schedules(user_id);

-- Insert initial user data
INSERT INTO public.users (id, name, color, initial)
VALUES 
  (1, 'Riko', '#BB86FC', 'R'),
  (2, 'Narumi', '#03DAC6', 'N'),
  (3, 'John', '#CF6679', 'J');

-- Insert sample schedule data
INSERT INTO public.schedules (user_id, day, start_time, end_time, label, all_day)
VALUES
  -- Riko's schedule
  (1, 'Monday', '16:00', '23:00', 'Work', false),
  (1, 'Tuesday', '17:00', '22:00', 'Work', false),
  (1, 'Wednesday', '12:00', '22:00', 'Work', false),
  (1, 'Thursday', '12:00', '23:00', 'Work', false),
  (1, 'Friday', '17:00', '23:30', 'Work', false),
  (1, 'Saturday', '17:00', '23:30', 'Work', false),
  (1, 'Sunday', '16:00', '22:00', 'Work', false),
  
  -- Narumi's schedule
  (2, 'Monday', '10:00', '19:45', 'Work', false),
  (2, 'Tuesday', '00:00', '23:59', 'Day off', true),
  (2, 'Wednesday', '00:00', '23:59', 'Day off', true),
  (2, 'Thursday', '10:00', '19:45', 'Work', false),
  (2, 'Friday', '00:00', '23:59', 'Day off', true),
  (2, 'Saturday', '06:00', '18:45', 'Work', false),
  (2, 'Sunday', '11:00', '19:45', 'Work', false),
  
  -- John's schedule
  (3, 'Monday', '09:00', '17:00', 'Work', false),
  (3, 'Tuesday', '09:00', '21:00', 'Work', false),
  (3, 'Wednesday', '09:00', '17:00', 'Work', false),
  (3, 'Thursday', '09:00', '17:00', 'Work', false),
  (3, 'Friday', '00:00', '23:59', 'Day off', true),
  (3, 'Saturday', '00:00', '23:59', 'Out of town', true),
  (3, 'Sunday', '00:00', '23:59', 'Out of town', true);
