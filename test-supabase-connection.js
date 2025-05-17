const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '.env.local');
const result = config({ path: envPath });

if (result.error) {
  console.error('Error loading .env.local file:', result.error);
  process.exit(1);
}

console.log('Environment variables loaded from:', envPath);

async function testConnection() {
  // Initialize the Supabase client with environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase URL or Anon Key in environment variables');
    process.exit(1);
  }

  console.log('Testing connection to Supabase...');
  console.log(`URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check if we can fetch users
    console.log('\nTest 1: Fetching users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(3);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log('Users found:', users);
    }

    // Test 2: Try to insert a test record
    console.log('\nTest 2: Inserting test record...');
    const testRecord = {
      user_id: 1,  // Assuming user with ID 1 exists
      day: 'Monday',
      start_time: '09:00',
      end_time: '17:00',
      label: 'Test Schedule',
      all_day: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('schedules')
      .insert([testRecord])
      .select();

    if (insertError) {
      console.error('Error inserting test record:', insertError);
    } else {
      console.log('Successfully inserted test record:', insertData);
      
      // Test 3: Try to delete the test record
      if (insertData && insertData.length > 0) {
        console.log('\nTest 3: Cleaning up test record...');
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', insertData[0].id);

        if (deleteError) {
          console.error('Error deleting test record:', deleteError);
        } else {
          console.log('Successfully cleaned up test record');
        }
      }
    }

    // Test 4: Check database tables
    console.log('\nTest 4: Checking database tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      console.log('Available tables:', tables.map(t => t.tablename).join(', '));
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
