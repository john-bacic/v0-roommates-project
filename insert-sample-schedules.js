// Script to insert sample schedules into the Supabase database
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

// Sample schedule data
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

async function insertSampleSchedules() {
  console.log('Inserting sample schedules...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Make sure users exist by inserting/updating them
    console.log('Ensuring users exist...');
    
    const users = [
      { user_name: 'Riko', color: '#BB86FC', initial: 'R' },
      { user_name: 'Narumi', color: '#03DAC6', initial: 'N' },
      { user_name: 'John', color: '#CF6679', initial: 'J' }
    ];
    
    for (const user of users) {
      console.log(`Ensuring user exists: ${user.user_name}`);
      
      const { error } = await supabase
        .rpc('insert_user_color', {
          p_user_name: user.user_name,
          p_color: user.color
        });
      
      if (error) {
        console.error(`Error ensuring user ${user.user_name}:`, error);
      } else {
        console.log(`User ${user.user_name} exists or was created successfully`);
      }
    }
    
    // Step 2: Clear existing schedules
    console.log('Clearing existing schedules...');
    
    // First, get all existing schedules
    const { data: existingSchedules, error: getSchedulesError } = await supabase
      .from('schedules')
      .select('id');
    
    if (getSchedulesError) {
      console.error('Error getting existing schedules:', getSchedulesError);
    } else if (existingSchedules && existingSchedules.length > 0) {
      console.log(`Found ${existingSchedules.length} existing schedules to delete`);
      
      // Delete schedules one by one to avoid RLS issues
      for (const schedule of existingSchedules) {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', schedule.id);
        
        if (deleteError) {
          console.error(`Error deleting schedule ${schedule.id}:`, deleteError);
        }
      }
      
      console.log('Finished clearing existing schedules');
    } else {
      console.log('No existing schedules found');
    }
    
    // Step 3: Insert sample schedules
    console.log('Inserting new schedules...');
    
    // Insert schedules one by one to avoid RLS issues
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
    
    // Step 4: Verify the data
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
    
    console.log('Sample data insertion completed successfully!');
  } catch (error) {
    console.error('Unexpected error during data insertion:', error);
  }
}

insertSampleSchedules();
