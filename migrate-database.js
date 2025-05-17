// Script to migrate existing Supabase database to the new schema
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

async function migrateDatabase() {
  console.log('Starting database migration...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Check existing tables and data
    console.log('Checking existing tables...');
    
    // Check user_colors table
    const { data: userColors, error: userColorsError } = await supabase
      .from('user_colors')
      .select('*');
    
    if (userColorsError) {
      console.error('Error querying user_colors table:', userColorsError);
      return;
    }
    
    console.log(`Found ${userColors.length} records in user_colors table`);
    
    // Check schedules table
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*');
    
    if (schedulesError) {
      console.error('Error querying schedules table:', schedulesError);
      return;
    }
    
    console.log(`Found ${schedules.length} records in schedules table`);
    console.log('First schedule record:', schedules.length > 0 ? schedules[0] : 'No records');
    
    // Step 2: Clear existing data
    console.log('Clearing existing data...');
    
    // Clear user_colors table
    const { error: clearUserColorsError } = await supabase
      .from('user_colors')
      .delete()
      .gte('id', 0);
    
    if (clearUserColorsError) {
      console.error('Error clearing user_colors table:', clearUserColorsError);
      return;
    }
    
    console.log('user_colors table cleared successfully');
    
    // Clear schedules table
    const { error: clearSchedulesError } = await supabase
      .from('schedules')
      .delete()
      .gte('id', 0);
    
    if (clearSchedulesError) {
      console.error('Error clearing schedules table:', clearSchedulesError);
      return;
    }
    
    console.log('schedules table cleared successfully');
    
    // Step 3: Insert new user data
    console.log('Inserting new user data...');
    
    const initialUsers = [
      { user_name: 'Riko', color: '#BB86FC', initial: 'R' },
      { user_name: 'Narumi', color: '#03DAC6', initial: 'N' },
      { user_name: 'John', color: '#CF6679', initial: 'J' }
    ];
    
    const { error: insertUsersError } = await supabase
      .from('user_colors')
      .insert(initialUsers);
    
    if (insertUsersError) {
      console.error('Error inserting users:', insertUsersError);
      return;
    }
    
    console.log('New user data inserted successfully');
    
    // Step 4: Get the inserted user IDs
    const { data: insertedUsers, error: getUsersError } = await supabase
      .from('user_colors')
      .select('*')
      .order('id', { ascending: true });
    
    if (getUsersError) {
      console.error('Error getting inserted users:', getUsersError);
      return;
    }
    
    console.log('Inserted users:', insertedUsers);
    
    // Step 5: Insert sample schedule data
    console.log('Inserting sample schedule data...');
    
    // Map user names to their IDs
    const userIdMap = {};
    insertedUsers.forEach(user => {
      userIdMap[user.user_name] = user.id;
    });
    
    console.log('User ID map:', userIdMap);
    
    // Prepare schedule data with the correct user IDs
    const sampleSchedules = [
      // Riko's schedule
      { user_id: userIdMap['Riko'], day: 'Monday', start_time: '16:00', end_time: '23:00', label: 'Work', all_day: false },
      { user_id: userIdMap['Riko'], day: 'Tuesday', start_time: '17:00', end_time: '22:00', label: 'Work', all_day: false },
      { user_id: userIdMap['Riko'], day: 'Wednesday', start_time: '12:00', end_time: '22:00', label: 'Work', all_day: false },
      { user_id: userIdMap['Riko'], day: 'Thursday', start_time: '12:00', end_time: '23:00', label: 'Work', all_day: false },
      { user_id: userIdMap['Riko'], day: 'Friday', start_time: '17:00', end_time: '23:30', label: 'Work', all_day: false },
      { user_id: userIdMap['Riko'], day: 'Saturday', start_time: '17:00', end_time: '23:30', label: 'Work', all_day: false },
      { user_id: userIdMap['Riko'], day: 'Sunday', start_time: '16:00', end_time: '22:00', label: 'Work', all_day: false },
      
      // Narumi's schedule
      { user_id: userIdMap['Narumi'], day: 'Monday', start_time: '10:00', end_time: '19:45', label: 'Work', all_day: false },
      { user_id: userIdMap['Narumi'], day: 'Tuesday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_id: userIdMap['Narumi'], day: 'Wednesday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_id: userIdMap['Narumi'], day: 'Thursday', start_time: '10:00', end_time: '19:45', label: 'Work', all_day: false },
      { user_id: userIdMap['Narumi'], day: 'Friday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_id: userIdMap['Narumi'], day: 'Saturday', start_time: '06:00', end_time: '18:45', label: 'Work', all_day: false },
      { user_id: userIdMap['Narumi'], day: 'Sunday', start_time: '11:00', end_time: '19:45', label: 'Work', all_day: false },
      
      // John's schedule
      { user_id: userIdMap['John'], day: 'Monday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_id: userIdMap['John'], day: 'Tuesday', start_time: '09:00', end_time: '21:00', label: 'Work', all_day: false },
      { user_id: userIdMap['John'], day: 'Wednesday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_id: userIdMap['John'], day: 'Thursday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_id: userIdMap['John'], day: 'Friday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_id: userIdMap['John'], day: 'Saturday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
      { user_id: userIdMap['John'], day: 'Sunday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
    ];
    
    // Insert schedules in batches to avoid potential limitations
    const batchSize = 10;
    for (let i = 0; i < sampleSchedules.length; i += batchSize) {
      const batch = sampleSchedules.slice(i, i + batchSize);
      console.log(`Inserting batch ${i/batchSize + 1} of ${Math.ceil(sampleSchedules.length/batchSize)}`);
      
      const { error: insertSchedulesError } = await supabase
        .from('schedules')
        .insert(batch);
      
      if (insertSchedulesError) {
        console.error(`Error inserting schedules batch ${i/batchSize + 1}:`, insertSchedulesError);
        return;
      }
    }
    
    console.log('Sample schedules inserted successfully');
    
    // Step 6: Verify the data
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
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Unexpected error during migration:', error);
  }
}

migrateDatabase();
