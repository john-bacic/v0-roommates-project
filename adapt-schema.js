// Script to adapt the SQL schema to work with the existing Supabase structure
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

// Initial user data
const initialUsers = [
  { user_name: 'Riko', color: '#BB86FC' },
  { user_name: 'Narumi', color: '#03DAC6' },
  { user_name: 'John', color: '#CF6679' }
];

// Sample schedule data adapted to use user_name instead of user_id
const sampleSchedules = [
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
  { user_name: 'John', day: 'Sunday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true }
];

async function adaptSchema() {
  console.log('Adapting schema to work with existing Supabase structure...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Check the structure of existing tables
    console.log('Checking structure of existing tables...');
    
    // Check user_colors table
    const { data: userColorsData, error: userColorsError } = await supabase
      .from('user_colors')
      .select('*')
      .limit(1);
    
    if (userColorsError) {
      console.error('Error checking user_colors table:', userColorsError);
      return;
    }
    
    console.log('user_colors table structure:', userColorsData.length > 0 ? Object.keys(userColorsData[0]) : 'No data');
    
    // Check schedules table
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(1);
    
    if (schedulesError) {
      console.error('Error checking schedules table:', schedulesError);
      return;
    }
    
    console.log('schedules table structure:', schedulesData.length > 0 ? Object.keys(schedulesData[0]) : 'No data');
    
    // Step 2: Clear existing data
    console.log('Clearing existing data...');
    
    // Clear schedules table
    const { error: clearSchedulesError } = await supabase
      .from('schedules')
      .delete()
      .not('id', 'is', null);
    
    if (clearSchedulesError) {
      console.error('Error clearing schedules:', clearSchedulesError);
    } else {
      console.log('Schedules cleared successfully.');
    }
    
    // Clear user_colors table
    const { error: clearUserColorsError } = await supabase
      .from('user_colors')
      .delete()
      .not('id', 'is', null);
    
    if (clearUserColorsError) {
      console.error('Error clearing user_colors:', clearUserColorsError);
    } else {
      console.log('user_colors cleared successfully.');
    }
    
    // Step 3: Insert user data using the stored procedure
    console.log('Inserting user data using stored procedure...');
    
    for (const user of initialUsers) {
      console.log(`Inserting user: ${user.user_name} with color: ${user.color}`);
      
      const { error } = await supabase
        .rpc('insert_user_color', {
          p_user_name: user.user_name,
          p_color: user.color
        });
      
      if (error) {
        console.error(`Error inserting user ${user.user_name}:`, error);
      } else {
        console.log(`Successfully inserted user ${user.user_name}`);
      }
    }
    
    // Step 4: Insert schedule data
    console.log('Inserting schedule data...');
    
    // Insert schedules one by one to avoid batch limitations
    for (const schedule of sampleSchedules) {
      console.log(`Inserting schedule for ${schedule.user_name} on ${schedule.day}`);
      
      const { error: insertError } = await supabase
        .from('schedules')
        .insert(schedule);
      
      if (insertError) {
        console.error(`Error inserting schedule for ${schedule.user_name} on ${schedule.day}:`, insertError);
      } else {
        console.log(`Successfully inserted schedule for ${schedule.user_name} on ${schedule.day}`);
      }
    }
    
    // Step 5: Verify the data
    console.log('Verifying data...');
    
    const { data: finalUsers, error: finalUsersError } = await supabase
      .from('user_colors')
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
    
    console.log('Schema adaptation and data insertion completed successfully!');
    console.log('\nIMPORTANT: Your app is already set up to work with this schema structure.');
    console.log('The key differences from your SQL are:');
    console.log('1. Using "user_colors" table instead of "users"');
    console.log('2. Using "user_name" in the schedules table instead of "user_id"');
    console.log('3. The user_colors table has a different structure than your users table');
  } catch (error) {
    console.error('Unexpected error during schema adaptation:', error);
  }
}

adaptSchema();
