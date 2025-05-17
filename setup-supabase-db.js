// Script to set up Supabase database using the Supabase client API
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

async function setupDatabase() {
  console.log('Setting up Supabase database...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First, check if the tables exist and delete any existing data
    console.log('Checking and clearing existing data...');
    
    // Check if users table exists by trying to query it
    const { error: usersQueryError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (!usersQueryError) {
      console.log('Users table exists, deleting all data...');
      const { error: deleteUsersError } = await supabase
        .from('users')
        .delete()
        .neq('id', 0); // Delete all rows
      
      if (deleteUsersError) {
        console.error('Error deleting users:', deleteUsersError);
      } else {
        console.log('All users deleted successfully.');
      }
    } else {
      console.log('Users table does not exist or cannot be accessed.');
    }
    
    // Check if schedules table exists by trying to query it
    const { error: schedulesQueryError } = await supabase
      .from('schedules')
      .select('id')
      .limit(1);
    
    if (!schedulesQueryError) {
      console.log('Schedules table exists, deleting all data...');
      const { error: deleteSchedulesError } = await supabase
        .from('schedules')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (deleteSchedulesError) {
        console.error('Error deleting schedules:', deleteSchedulesError);
      } else {
        console.log('All schedules deleted successfully.');
      }
    } else {
      console.log('Schedules table does not exist or cannot be accessed.');
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
    } else {
      console.log('Initial users inserted successfully.');
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
    } else {
      console.log('Sample schedules inserted successfully.');
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupDatabase();
