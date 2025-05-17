const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up Supabase database...');

  try {
    // Check if tables already exist
    const { data: existingTables, error: tablesError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!tablesError) {
      console.log('Tables already exist. Skipping table creation.');
    } else {
      console.log('Creating tables...');
      
      // Create users table using direct SQL
      const createUsersSQL = `
        CREATE TABLE IF NOT EXISTS public.users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          initial TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
      `;
      
      const { error: createUsersError } = await supabase.rpc('exec_sql', { sql: createUsersSQL });
      
      if (createUsersError) {
        console.error('Error creating users table:', createUsersError);
        // Try an alternative approach
        console.log('Trying alternative approach for creating users table...');
        const { error: altError } = await supabase.from('_exec_sql').select('*').eq('query', createUsersSQL);
        if (altError) {
          console.error('Alternative approach failed:', altError);
          return;
        }
      }
      
      // Create schedules table using direct SQL
      const createSchedulesSQL = `
        CREATE TABLE IF NOT EXISTS public.schedules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id INTEGER NOT NULL REFERENCES public.users(id),
          day TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          label TEXT NOT NULL,
          all_day BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS schedules_user_id_idx ON public.schedules(user_id);
      `;
      
      const { error: createSchedulesError } = await supabase.rpc('exec_sql', { sql: createSchedulesSQL });
      
      if (createSchedulesError) {
        console.error('Error creating schedules table:', createSchedulesError);
        // Try an alternative approach
        console.log('Trying alternative approach for creating schedules table...');
        const { error: altError } = await supabase.from('_exec_sql').select('*').eq('query', createSchedulesSQL);
        if (altError) {
          console.error('Alternative approach failed:', altError);
          return;
        }
      }
      
      console.log('Tables created successfully.');
    }

    // Insert initial user data
    console.log('Inserting initial user data...');
    
    const initialUsers = [
      { id: 1, name: 'Riko', color: '#BB86FC', initial: 'R' },
      { id: 2, name: 'Narumi', color: '#03DAC6', initial: 'N' },
      { id: 3, name: 'John', color: '#CF6679', initial: 'J' },
    ];
    
    const { error: insertUsersError } = await supabase
      .from('users')
      .upsert(initialUsers, { onConflict: 'id' });
    
    if (insertUsersError) {
      console.error('Error inserting users:', insertUsersError);
      return;
    }
    
    // Insert sample schedule data
    console.log('Inserting sample schedule data...');
    
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
      { user_id: 3, day: 'Sunday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
    ];
    
    const { error: insertSchedulesError } = await supabase
      .from('schedules')
      .upsert(sampleSchedules, { onConflict: ['user_id', 'day', 'start_time'] });
    
    if (insertSchedulesError) {
      console.error('Error inserting schedules:', insertSchedulesError);
      return;
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupDatabase();
