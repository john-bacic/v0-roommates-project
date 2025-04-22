const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertInitialData() {
  console.log('Inserting initial data into Supabase...');

  try {
    // Insert initial user data
    console.log('Inserting users...');
    
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
      console.log('Users inserted successfully!');
    }
    
    // Insert sample schedule data
    console.log('Inserting schedules...');
    
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
    
    // Clear existing schedules first to avoid duplicates
    const { error: clearError } = await supabase
      .from('schedules')
      .delete()
      .not('id', 'is', null);
      
    if (clearError) {
      console.error('Error clearing existing schedules:', clearError);
    } else {
      console.log('Existing schedules cleared.');
    }
    
    // Insert new schedules
    const { error: insertSchedulesError } = await supabase
      .from('schedules')
      .insert(sampleSchedules);
    
    if (insertSchedulesError) {
      console.error('Error inserting schedules:', insertSchedulesError);
    } else {
      console.log('Schedules inserted successfully!');
    }
    
    console.log('Initial data insertion completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

insertInitialData();
