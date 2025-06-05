-- Enable Row Level Security on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
-- Allow users to read all users (for displaying in the app)
CREATE POLICY "Users are viewable by all authenticated users" 
ON public.users FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow users to update only their own data
CREATE POLICY "Users can update their own data" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert their own data" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create policies for the schedules table
-- Allow users to read all schedules (for displaying in the app)
CREATE POLICY "Schedules are viewable by all authenticated users" 
ON public.schedules FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow users to insert their own schedules
CREATE POLICY "Users can insert their own schedules" 
ON public.schedules FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own schedules
CREATE POLICY "Users can update their own schedules" 
ON public.schedules FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete only their own schedules
CREATE POLICY "Users can delete their own schedules" 
ON public.schedules FOR DELETE 
USING (auth.uid() = user_id);

-- Create a special policy for the application service role if needed
-- This allows your server-side code to bypass RLS when needed
CREATE POLICY "Service role has full access to users" 
ON public.users
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to schedules" 
ON public.schedules
USING (auth.jwt() ->> 'role' = 'service_role');
