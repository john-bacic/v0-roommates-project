-- Enable Row Level Security on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- First, let's drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users are viewable by all authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;

DROP POLICY IF EXISTS "Schedules are viewable by all authenticated users" ON public.schedules;
DROP POLICY IF EXISTS "Users can insert their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Service role has full access to schedules" ON public.schedules;

-- Create policies for the users table
-- Allow anyone to read all users (for displaying in the app)
CREATE POLICY "Users are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Allow users to update only their own data (if auth is enabled)
-- If auth is not enabled, we'll need a different approach
CREATE POLICY "Users can update their own data" 
ON public.users FOR UPDATE 
USING (true);  -- Change this to (auth.uid() = id) if auth is enabled

-- Allow users to insert data (if auth is enabled)
-- If auth is not enabled, we'll need a different approach
CREATE POLICY "Users can insert data" 
ON public.users FOR INSERT 
WITH CHECK (true);  -- Change this to WITH CHECK (auth.uid() = id) if auth is enabled

-- Create policies for the schedules table
-- Allow anyone to read all schedules (for displaying in the app)
CREATE POLICY "Schedules are viewable by everyone" 
ON public.schedules FOR SELECT 
USING (true);

-- Allow users to insert schedules (if auth is enabled)
-- If auth is not enabled, we'll need a different approach
CREATE POLICY "Users can insert schedules" 
ON public.schedules FOR INSERT 
WITH CHECK (true);  -- Change this to WITH CHECK (auth.uid() = user_id) if auth is enabled

-- Allow users to update schedules (if auth is enabled)
-- If auth is not enabled, we'll need a different approach
CREATE POLICY "Users can update schedules" 
ON public.schedules FOR UPDATE 
USING (true);  -- Change this to USING (auth.uid() = user_id) if auth is enabled

-- Allow users to delete schedules (if auth is enabled)
-- If auth is not enabled, we'll need a different approach
CREATE POLICY "Users can delete schedules" 
ON public.schedules FOR DELETE 
USING (true);  -- Change this to USING (auth.uid() = user_id) if auth is enabled

-- Create a special policy for the application service role if needed
-- This is only needed if you're using auth
-- CREATE POLICY "Service role has full access to users" 
-- ON public.users
-- USING (auth.jwt() ->> 'role' = 'service_role');

-- CREATE POLICY "Service role has full access to schedules" 
-- ON public.schedules
-- USING (auth.jwt() ->> 'role' = 'service_role');
