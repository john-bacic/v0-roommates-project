// Script to set up database procedures for the roommate scheduling app
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

// Sample data for users and schedules
const initialUsers = [
  { name: 'Riko', color: '#BB86FC', initial: 'R' },
  { name: 'Narumi', color: '#03DAC6', initial: 'N' },
  { name: 'John', color: '#CF6679', initial: 'J' }
];

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
  { user_name: 'John', day: 'Sunday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
];

async function setupDatabaseProcedures() {
  console.log('Setting up database procedures...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Insert users using the existing stored procedure
    console.log('Inserting users using existing stored procedure...');
    
    for (const user of initialUsers) {
      console.log(`Inserting user: ${user.name} with color: ${user.color}`);
      
      const { error } = await supabase
        .rpc('insert_user_color', {
          p_user_name: user.name,
          p_color: user.color
        });
      
      if (error) {
        console.error(`Error inserting user ${user.name}:`, error);
      } else {
        console.log(`Successfully inserted user ${user.name}`);
      }
    }
    
    // Step 2: Get the inserted users to map names to IDs
    console.log('Getting user IDs...');
    
    const { data: users, error: getUsersError } = await supabase
      .from('user_colors')
      .select('*');
    
    if (getUsersError) {
      console.error('Error getting users:', getUsersError);
      return;
    }
    
    console.log('Retrieved users:', users);
    
    // Create a map of user names to IDs
    const userMap = {};
    users.forEach(user => {
      userMap[user.user_name] = user.id;
    });
    
    console.log('User map:', userMap);
    
    // Step 3: Clear existing schedules
    console.log('Clearing existing schedules...');
    
    const { error: clearSchedulesError } = await supabase
      .rpc('clear_schedules');
    
    if (clearSchedulesError) {
      console.error('Error clearing schedules:', clearSchedulesError);
      console.log('Attempting to continue anyway...');
    } else {
      console.log('Schedules cleared successfully');
    }
    
    // Step 4: Insert schedules
    console.log('Inserting schedules...');
    
    for (const schedule of sampleSchedules) {
      const userId = userMap[schedule.user_name];
      
      if (!userId) {
        console.error(`User ID not found for ${schedule.user_name}`);
        continue;
      }
      
      console.log(`Inserting schedule for ${schedule.user_name} (ID: ${userId}) on ${schedule.day}`);
      
      const { error } = await supabase
        .rpc('insert_schedule', {
          p_user_id: userId,
          p_day: schedule.day,
          p_start_time: schedule.start_time,
          p_end_time: schedule.end_time,
          p_label: schedule.label,
          p_all_day: schedule.all_day
        });
      
      if (error) {
        console.error(`Error inserting schedule for ${schedule.user_name} on ${schedule.day}:`, error);
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
    }
    
    const { data: finalSchedules, error: finalSchedulesError } = await supabase
      .from('schedules')
      .select('*');
    
    if (finalSchedulesError) {
      console.error('Error verifying schedules:', finalSchedulesError);
    } else {
      console.log(`Verified ${finalSchedules.length} schedules in the database`);
      console.log('Sample schedules:', finalSchedules.slice(0, 2));
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Unexpected error during database setup:', error);
  }
}

setupDatabaseProcedures();
