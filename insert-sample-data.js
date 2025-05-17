// Script to insert sample data into Supabase database
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

async function insertSampleData() {
  console.log('Starting sample data insertion...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Insert user data into user_colors table
    console.log('Inserting user data into user_colors table...');
    
    const userData = [
      { user_name: 'Riko', color: '#BB86FC' },
      { user_name: 'Narumi', color: '#03DAC6' },
      { user_name: 'John', color: '#CF6679' }
    ];
    
    const { data: insertedUsers, error: userInsertError } = await supabase
      .from('user_colors')
      .upsert(userData, { onConflict: 'user_name' })
      .select();
    
    if (userInsertError) {
      console.error('Error inserting users:', userInsertError);
      return;
    }
    
    console.log('User data inserted successfully:', insertedUsers);
    
    // Step 2: Insert schedule data
    console.log('Inserting schedule data...');
    
    // Map user names to their IDs
    const userIdMap = {};
    insertedUsers.forEach(user => {
      userIdMap[user.user_name] = user.id;
    });
    
    console.log('User ID map:', userIdMap);
    
    // Prepare schedule data
    const scheduleData = [
      // Riko's schedule
      { user_name: 'Riko', day: 'Monday', start_time: '16:00', end_time: '23:00', label: 'Work', all_day: false },
      { user_name: 'Riko', day: 'Tuesday', start_time: '17:00', end_time: '22:00', label: 'Work', all_day: false },
      { user_name: 'Riko', day: 'Wednesday', start_time: '12:00', end_time: '22:00', label: 'Work', all_day: false },
      { user_name: 'Riko', day: 'Thursday', start_time: '12:00', end_time: '23:00', label: 'Work', all_day: false },
      { user_name: 'Riko', day: 'Friday', start_time: '17:00', end_time: '23:30', label: 'Work', all_day: false },
      { user_name: 'Riko', day: 'Saturday', start_time: '17:00', end_time: '23:30', label: 'Work', all_day: false },
      { user_name: 'Riko', day: 'Sunday', start_time: '16:00', end_time: '22:00', label: 'Work', all_day: false },
      
      // Narumi's schedule
      { user_name: 'Narumi', day: 'Monday', start_time: '10:00', end_time: '19:45', label: 'Work', all_day: false },
      { user_name: 'Narumi', day: 'Tuesday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_name: 'Narumi', day: 'Wednesday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_name: 'Narumi', day: 'Thursday', start_time: '10:00', end_time: '19:45', label: 'Work', all_day: false },
      { user_name: 'Narumi', day: 'Friday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_name: 'Narumi', day: 'Saturday', start_time: '06:00', end_time: '18:45', label: 'Work', all_day: false },
      { user_name: 'Narumi', day: 'Sunday', start_time: '11:00', end_time: '19:45', label: 'Work', all_day: false },
      
      // John's schedule
      { user_name: 'John', day: 'Monday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_name: 'John', day: 'Tuesday', start_time: '09:00', end_time: '21:00', label: 'Work', all_day: false },
      { user_name: 'John', day: 'Wednesday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_name: 'John', day: 'Thursday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_name: 'John', day: 'Friday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_name: 'John', day: 'Saturday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
      { user_name: 'John', day: 'Sunday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
    ];
    
    // Clear existing schedules
    console.log('Clearing existing schedules...');
    const { error: clearError } = await supabase
      .from('schedules')
      .delete()
      .not('id', 'is', null);
    
    if (clearError) {
      console.error('Error clearing schedules:', clearError);
      // Continue anyway
    }
    
    // Insert schedules in batches to avoid potential limitations
    const batchSize = 5;
    for (let i = 0; i < scheduleData.length; i += batchSize) {
      const batch = scheduleData.slice(i, i + batchSize);
      console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(scheduleData.length/batchSize)}`);
      
      const { error: insertError } = await supabase
        .from('schedules')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting schedules batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        return;
      }
    }
    
    console.log('Schedule data inserted successfully');
    
    // Step 3: Verify the data
    const { data: finalUsers, error: finalUsersError } = await supabase
      .from('user_colors')
      .select('*');
    
    if (finalUsersError) {
      console.error('Error verifying users:', finalUsersError);
    } else {
      console.log(`Verified ${finalUsers.length} users in the database`);
    }
    
    const { data: finalSchedules, error: finalSchedulesError } = await supabase
      .from('schedules')
      .select('*');
    
    if (finalSchedulesError) {
      console.error('Error verifying schedules:', finalSchedulesError);
    } else {
      console.log(`Verified ${finalSchedules.length} schedules in the database`);
    }
    
    console.log('Sample data insertion completed successfully!');
  } catch (error) {
    console.error('Unexpected error during data insertion:', error);
  }
}

insertSampleData();
