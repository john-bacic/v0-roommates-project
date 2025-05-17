// Script to insert initial users into the user_colors table
const { createClient } = require('@supabase/supabase-js');

// Use the production URL and key directly
const supabaseUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

// Initial users data
const initialUsers = [
  { user_name: 'Riko', color: '#BB86FC' },
  { user_name: 'Narumi', color: '#03DAC6' },
  { user_name: 'John', color: '#CF6679' }
];

async function insertInitialUsers() {
  console.log('Inserting initial users into user_colors table...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Insert each user using the stored procedure
    for (const user of initialUsers) {
      console.log(`Inserting user: ${user.user_name} with color: ${user.color}`);
      
      const { error } = await supabase
        .rpc('insert_user_color', {
          p_user_name: user.user_name,
          p_color: user.color
        });
      
      if (error) {
        console.error(`Error inserting user ${user.user_name}:`, error);
      } else {
        console.log(`Successfully inserted user ${user.user_name}`);
      }
    }
    
    console.log('Initial users insertion completed');
  } catch (error) {
    console.error('Error inserting initial users:', error);
  }
}

insertInitialUsers();
