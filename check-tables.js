const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking Supabase tables...');

  try {
    // List all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      console.log('Attempting to create tables directly...');
      
      // Create users table directly
      const { error: createUsersError } = await supabase
        .from('users')
        .insert([
          { 
            name: 'Riko',
            color_code: '#BB86FC',
            initial: 'R'
          }
        ]);
      
      if (createUsersError) {
        console.error('Error creating users table:', createUsersError);
        console.log('Error details:', createUsersError.details);
      } else {
        console.log('Users table created successfully!');
      }
      
      return;
    }
    
    console.log('Tables in the database:', tables);
    
    // Try to select from users table to see its structure
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      
      // Try to create the users table
      console.log('Attempting to create users table...');
      
      // Use SQL to create the table
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            color_code TEXT NOT NULL,
            initial TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );
        `
      });
      
      if (sqlError) {
        console.error('Error creating users table with SQL:', sqlError);
      } else {
        console.log('Users table created successfully with SQL!');
      }
    } else {
      console.log('Users table structure:', users);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTables();
