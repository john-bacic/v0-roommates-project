const { createClient } = require('@supabase/supabase-js');

// Get Supabase configuration from environment
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Testing Supabase connection...");
console.log(`URL: ${supabaseUrl}`);
console.log(`Key exists: ${supabaseKey ? 'Yes' : 'No'}`);

async function testConnection() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query
    console.log("Testing users table query...");
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (usersError) {
      console.error("Error querying users:", usersError);
    } else {
      console.log("Users query successful:", users);
    }
    
    // Test a simple query
    console.log("Testing schedules table query...");
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(1);
      
    if (schedulesError) {
      console.error("Error querying schedules:", schedulesError);
    } else {
      console.log("Schedules query successful:", schedules);
    }
    
    // Test realtime subscription
    console.log("Testing realtime subscription...");
    const subscription = supabase
      .channel('test-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users'
      }, payload => {
        console.log('Realtime update received:', payload);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
      
    // Give it a few seconds to establish the subscription
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Clean up subscription
    subscription.unsubscribe();
    
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testConnection();
