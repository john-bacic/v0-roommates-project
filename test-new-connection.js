// Script to test connection to the new Supabase database
const { createClient } = require('@supabase/supabase-js');

// New Supabase URL and key
const supabaseUrl = 'https://lzfsuovymvkkqdegiurk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZnN1b3Z5bXZra3FkZWdpdXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU2MDI2MzEsImV4cCI6MjAzMTI2NDYzMX0.VmGHpSHnBSkeG-fAY0V0OJmQdO1_2QQnIrIVuIy_YIw';

async function testConnection() {
  console.log('Testing connection to new Supabase database...');
  console.log('URL:', supabaseUrl);
  console.log('Key length:', supabaseKey.length);
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');
    
    // Test query to users table
    console.log('Testing query to users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);
    
    if (usersError) {
      console.error('Error querying users table:', usersError);
    } else {
      console.log('Successfully queried users table!');
      console.log('Data:', usersData);
    }
    
    // Test query to schedules table
    console.log('Testing query to schedules table...');
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(10);
    
    if (schedulesError) {
      console.error('Error querying schedules table:', schedulesError);
    } else {
      console.log('Successfully queried schedules table!');
      console.log('Data count:', schedulesData.length);
      if (schedulesData.length > 0) {
        console.log('Sample schedule:', schedulesData[0]);
      }
    }
    
    // Check for available tables
    console.log('Checking available tables...');
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('list_tables');
    
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
    } else {
      console.log('Available tables:', tablesData);
    }
    
    console.log('Connection test completed');
  } catch (error) {
    console.error('Unexpected error during connection test:', error);
  }
}

testConnection();
