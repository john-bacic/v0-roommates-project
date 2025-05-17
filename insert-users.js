// Script to directly insert users into the user_colors table
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

// Initial user data
const initialUsers = [
  { user_name: 'Riko', color: '#BB86FC' },
  { user_name: 'Narumi', color: '#03DAC6' },
  { user_name: 'John', color: '#CF6679' }
];

async function insertUsers() {
  console.log('Inserting users directly into user_colors table...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Clear existing users
    console.log('Clearing existing users...');
    const { error: clearError } = await supabase
      .from('user_colors')
      .delete()
      .not('id', 'is', null);
    
    if (clearError) {
      console.error('Error clearing users:', clearError);
    } else {
      console.log('Users cleared successfully.');
    }
    
    // Insert users directly
    console.log('Inserting users...');
    for (const user of initialUsers) {
      const { data, error } = await supabase
        .from('user_colors')
        .insert(user)
        .select();
      
      if (error) {
        console.error(`Error inserting user ${user.user_name}:`, error);
      } else {
        console.log(`Successfully inserted user ${user.user_name}:`, data);
      }
    }
    
    // Verify users
    const { data: finalUsers, error: finalError } = await supabase
      .from('user_colors')
      .select('*');
    
    if (finalError) {
      console.error('Error verifying users:', finalError);
    } else {
      console.log(`Verified ${finalUsers.length} users in the database:`);
      console.log(finalUsers);
    }
    
    console.log('User insertion completed successfully!');
  } catch (error) {
    console.error('Unexpected error during user insertion:', error);
  }
}

insertUsers();
