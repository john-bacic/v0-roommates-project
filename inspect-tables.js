const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTables() {
  console.log('Inspecting Supabase tables...');

  try {
    // Check users table
    console.log('Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('Error querying users table:', usersError);
    } else {
      console.log('Users table exists with columns:', usersData.length > 0 ? Object.keys(usersData[0]) : 'No records found');
      console.log('Sample data:', usersData);
    }

    // Check schedules table
    console.log('\nChecking schedules table...');
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(1);

    if (schedulesError) {
      console.error('Error querying schedules table:', schedulesError);
    } else {
      console.log('Schedules table exists with columns:', schedulesData.length > 0 ? Object.keys(schedulesData[0]) : 'No records found');
      console.log('Sample data:', schedulesData);
    }

    // Try to get table information using system tables
    console.log('\nAttempting to get table information from system tables...');
    const { data: tableInfo, error: tableInfoError } = await supabase
      .rpc('get_table_info', { table_name: 'users' });

    if (tableInfoError) {
      console.error('Error getting table info:', tableInfoError);
    } else {
      console.log('Table info:', tableInfo);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

inspectTables();
