// Simple script to test Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key length:', supabaseKey.length);
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');
    
    // Test query to user_colors table
    console.log('Testing query to user_colors table...');
    const { data: userColors, error: userColorsError } = await supabase
      .from('user_colors')
      .select('*');
    
    if (userColorsError) {
      console.error('Error querying user_colors table:', userColorsError);
    } else {
      console.log('Successfully queried user_colors table!');
      console.log('Data:', userColors);
    }
    
    // Test query to schedules table
    console.log('Testing query to schedules table...');
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*');
    
    if (schedulesError) {
      console.error('Error querying schedules table:', schedulesError);
    } else {
      console.log('Successfully queried schedules table!');
      console.log('Data count:', schedules.length);
    }
    
    console.log('Connection test completed');
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
  }
}

testConnection();
