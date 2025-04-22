-- Create function to create users table
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Create users table
    CREATE TABLE public.users (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      initial TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    -- Set up RLS (Row Level Security)
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow anyone to read users
    CREATE POLICY "Allow anyone to read users"
      ON public.users
      FOR SELECT
      USING (true);
      
    -- Create policy to allow authenticated users to update their own user
    CREATE POLICY "Allow users to update their own user"
      ON public.users
      FOR UPDATE
      USING (auth.uid()::text = id::text);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to create schedules table
CREATE OR REPLACE FUNCTION create_schedules_table()
RETURNS void AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schedules') THEN
    -- Create schedules table
    CREATE TABLE public.schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT NOT NULL REFERENCES public.users(id),
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      label TEXT NOT NULL,
      all_day BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    -- Create index for faster queries
    CREATE INDEX schedules_user_id_idx ON public.schedules(user_id);
    
    -- Set up RLS (Row Level Security)
    ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow anyone to read schedules
    CREATE POLICY "Allow anyone to read schedules"
      ON public.schedules
      FOR SELECT
      USING (true);
      
    -- Create policy to allow authenticated users to update their own schedules
    CREATE POLICY "Allow users to update their own schedules"
      ON public.schedules
      FOR ALL
      USING (auth.uid()::text = user_id::text);
  END IF;
END;
$$ LANGUAGE plpgsql;
