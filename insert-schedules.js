const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSchedules() {
  console.log('Inserting sample schedule data...');

  try {
    // First, get the user IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log('Users found:', users);
    
    if (!users || users.length === 0) {
      console.error('No users found in the database');
      return;
    }
    
    // Map user names to IDs
    const userMap = {};
    users.forEach(user => {
      userMap[user.name] = user.id;
    });
    
    console.log('User ID mapping:', userMap);
    
    // Sample schedules data
    const sampleSchedules = [
      // Riko's schedule
      { user_id: userMap['Riko'], day: 'Monday', start_time: '16:00', end_time: '23:00', label: 'Work', all_day: false },
      { user_id: userMap['Riko'], day: 'Tuesday', start_time: '17:00', end_time: '22:00', label: 'Work', all_day: false },
      { user_id: userMap['Riko'], day: 'Wednesday', start_time: '12:00', end_time: '22:00', label: 'Work', all_day: false },
      { user_id: userMap['Riko'], day: 'Thursday', start_time: '12:00', end_time: '23:00', label: 'Work', all_day: false },
      { user_id: userMap['Riko'], day: 'Friday', start_time: '17:00', end_time: '23:30', label: 'Work', all_day: false },
      { user_id: userMap['Riko'], day: 'Saturday', start_time: '17:00', end_time: '23:30', label: 'Work', all_day: false },
      { user_id: userMap['Riko'], day: 'Sunday', start_time: '16:00', end_time: '22:00', label: 'Work', all_day: false },
      
      // Narumi's schedule
      { user_id: userMap['Narumi'], day: 'Monday', start_time: '10:00', end_time: '19:45', label: 'Work', all_day: false },
      { user_id: userMap['Narumi'], day: 'Tuesday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_id: userMap['Narumi'], day: 'Wednesday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_id: userMap['Narumi'], day: 'Thursday', start_time: '10:00', end_time: '19:45', label: 'Work', all_day: false },
      { user_id: userMap['Narumi'], day: 'Friday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_id: userMap['Narumi'], day: 'Saturday', start_time: '06:00', end_time: '18:45', label: 'Work', all_day: false },
      { user_id: userMap['Narumi'], day: 'Sunday', start_time: '11:00', end_time: '19:45', label: 'Work', all_day: false },
      
      // John's schedule
      { user_id: userMap['John'], day: 'Monday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_id: userMap['John'], day: 'Tuesday', start_time: '09:00', end_time: '21:00', label: 'Work', all_day: false },
      { user_id: userMap['John'], day: 'Wednesday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_id: userMap['John'], day: 'Thursday', start_time: '09:00', end_time: '17:00', label: 'Work', all_day: false },
      { user_id: userMap['John'], day: 'Friday', start_time: '00:00', end_time: '23:59', label: 'Day off', all_day: true },
      { user_id: userMap['John'], day: 'Saturday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
      { user_id: userMap['John'], day: 'Sunday', start_time: '00:00', end_time: '23:59', label: 'Out of town', all_day: true },
    ];
    
    // Insert schedules in batches to avoid hitting limits
    const batchSize = 10;
    for (let i = 0; i < sampleSchedules.length; i += batchSize) {
      const batch = sampleSchedules.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('schedules')
        .upsert(batch, { 
          onConflict: ['user_id', 'day', 'start_time'],
          ignoreDuplicates: true 
        });
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        console.log(`Batch ${i / batchSize + 1} inserted successfully`);
      }
    }
    
    console.log('Schedule data insertion completed!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

insertSchedules();
