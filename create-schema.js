// Script to create the exact schema specified in the SQL in Supabase
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

// SQL statements for creating the schema
const createSchemaSQL = `
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
`;

// Initial user data
const initialUsers = [
  { id: 1, name: 'Riko', color: '#BB86FC', initial: 'R' },
  { id: 2, name: 'Narumi', color: '#03DAC6', initial: 'N' },
  { id: 3, name: 'John', color: '#CF6679', initial: 'J' }
];

// Sample schedule data
const sampleSchedules = [
  // Riko's schedule
  { user_id: 1, day: 'Monday', start_time: '16:00', end_time: '23:00', label: 'Work', all_day: false },
  { user_id: 1, day: 'Tuesday', start_time: '17:00', end_time: '22:00', label: 'Work', all_day: false },
  { user_id: 1, day: 'Wednesday', start_time: '12:00', end_time: '22:00', label: 'Work', all_day: false },
  { user_id: 1, day: 'Thursday', start_time: '12:00', end_time: '23:00', label: 'Work', all_day: false },
  { user_id: 1, day: 'Friday', start_time: '17:00', end_time: '23:30', label: 'Work', all_day: false },
  { user_id: 1, day: 'Saturday', start_time: '17:00', end_time: '23:30', label: 'Work', all_day: false },
  { user_id: 1, day: 'Sunday', start_time: '16:00', end_time: '22:00', label: 'Work', all_day: false },
  
  // Narumi's schedule
  { user_id: 2, day: 'Monday', start_time: '10:00', end_time: '19:45', label: 'Work', all_day: false },
  { user_id: 2, day: 'Tuesday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
  { user_id: 2, day: 'Wednesday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
  { user_id: 2, day: 'Thursday', start_time: '10:00', end_time: '19:45', label: 'Work', all_day: false },
  { user_id: 2, day: 'Friday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
  { user_id: 2, day: 'Saturday', start_time: '06:00', end_time: '18:45', label: 'Work', all_day: false },
  { user_id: 2, day: 'Sunday', start_time: '11:00', end_time: '19:45', label: 'Work', all_day: false },
  
  // John's schedule
  { user_id: 3, day: 'Monday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
  { user_id: 3, day: 'Tuesday', start_time: '09:00', end_time: '21:00', label: 'Work', all_day: false },
  { user_id: 3, day: 'Wednesday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
  { user_id: 3, day: 'Thursday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
  { user_id: 3, day: 'Friday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
  { user_id: 3, day: 'Saturday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
  { user_id: 3, day: 'Sunday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true }
];

async function createSchema() {
  console.log('Creating schema in Supabase...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Try to execute the SQL directly
    console.log('Attempting to execute SQL directly...');
    
    try {
      // This might not work due to permissions, but we'll try
      const { error } = await supabase.rpc('exec_sql', { sql: createSchemaSQL });
      
      if (error) {
        console.error('Error executing SQL directly:', error);
        console.log('Will try alternative approach...');
      } else {
        console.log('SQL executed successfully!');
      }
    } catch (error) {
      console.error('Exception executing SQL directly:', error);
      console.log('Will try alternative approach...');
    }
    
    // Step 2: Check if tables exist and create them if needed
    console.log('Checking if tables exist...');
    
    // Check for users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('Users table does not exist or cannot be accessed.');
      console.log('Please create the tables manually in the Supabase dashboard using the SQL provided.');
      console.log('Then run this script again to insert the data.');
      return;
    }
    
    console.log('Users table exists, proceeding with data insertion...');
    
    // Step 3: Clear existing data
    console.log('Clearing existing data...');
    
    // Clear schedules table
    const { error: clearSchedulesError } = await supabase
      .from('schedules')
      .delete()
      .gte('user_id', 0);
    
    if (clearSchedulesError) {
      console.error('Error clearing schedules:', clearSchedulesError);
    } else {
      console.log('Schedules cleared successfully.');
    }
    
    // Clear users table
    const { error: clearUsersError } = await supabase
      .from('users')
      .delete()
      .gte('id', 0);
    
    if (clearUsersError) {
      console.error('Error clearing users:', clearUsersError);
    } else {
      console.log('Users cleared successfully.');
    }
    
    // Step 4: Insert user data
    console.log('Inserting user data...');
    
    const { error: insertUsersError } = await supabase
      .from('users')
      .upsert(initialUsers, { onConflict: 'id' });
    
    if (insertUsersError) {
      console.error('Error inserting users:', insertUsersError);
      return;
    }
    
    console.log('User data inserted successfully.');
    
    // Step 5: Insert schedule data
    console.log('Inserting schedule data...');
    
    // Insert schedules in batches to avoid potential limitations
    const batchSize = 5;
    for (let i = 0; i < sampleSchedules.length; i += batchSize) {
      const batch = sampleSchedules.slice(i, i + batchSize);
      console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(sampleSchedules.length/batchSize)}`);
      
      const { error: insertSchedulesError } = await supabase
        .from('schedules')
        .insert(batch);
      
      if (insertSchedulesError) {
        console.error(`Error inserting schedules batch ${Math.floor(i/batchSize) + 1}:`, insertSchedulesError);
        return;
      }
    }
    
    console.log('Schedule data inserted successfully.');
    
    // Step 6: Verify the data
    console.log('Verifying data...');
    
    const { data: finalUsers, error: finalUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (finalUsersError) {
      console.error('Error verifying users:', finalUsersError);
    } else {
      console.log(`Verified ${finalUsers.length} users in the database`);
      console.log('Users:', finalUsers);
    }
    
    const { data: finalSchedules, error: finalSchedulesError } = await supabase
      .from('schedules')
      .select('*');
    
    if (finalSchedulesError) {
      console.error('Error verifying schedules:', finalSchedulesError);
    } else {
      console.log(`Verified ${finalSchedules.length} schedules in the database`);
      console.log('Sample schedules:', finalSchedules.slice(0, 3));
    }
    
    console.log('Schema creation and data insertion completed successfully!');
    console.log('\nIMPORTANT: You may need to update your application code to work with this new schema.');
    console.log('The key differences are:');
    console.log('1. Using "users" table instead of "user_colors"');
    console.log('2. Using "user_id" in the schedules table instead of "user_name"');
  } catch (error) {
    console.error('Unexpected error during schema creation:', error);
  }
}

createSchema();
