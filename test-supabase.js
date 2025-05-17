// Simple test script to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in your app
const supabaseUrl = 'https://lzfsuovymvkkqdegiurk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZnN1b3Z5bXZra3FkZWdpdXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzIzNzAsImV4cCI6MjA2MDMwODM3MH0.fpfKpIRbXAQLjaJ7Bz7QYphrUYbwJ8BtfkFrmdq-a6E';

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Try to fetch users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log('Successfully fetched users:', users);
    }
    
    // Try to fetch schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(5);
    
    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
    } else {
      console.log('Successfully fetched schedules sample:', schedules.length, 'records');
    }
    
  } catch (error) {
    console.error('Unexpected error during test:', error);
  }
}

// Run the test
testConnection();