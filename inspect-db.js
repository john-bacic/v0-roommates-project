const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('Inspecting Supabase database...');

  try {
    // Try to query the users table with * to see what columns exist
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Error querying users table:', usersError);
      
      // If the table doesn't exist, let's create it
      console.log('Attempting to create users table...');
      
      const { error: createError } = await supabase.rpc('create_table', {
        table_name: 'users',
        columns: 'id serial primary key, name text, color text, initial text, created_at timestamptz default now()'
      });
      
      if (createError) {
        console.error('Error creating users table:', createError);
        
        // Try a direct SQL query to create the table
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              color TEXT NOT NULL,
              initial TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT now() NOT NULL
            );
          `
        });
        
        if (sqlError) {
          console.error('Error executing SQL to create users table:', sqlError);
        } else {
          console.log('Users table created successfully via SQL!');
        }
      } else {
        console.log('Users table created successfully!');
      }
    } else {
      console.log('Users table exists with columns:', Object.keys(usersData[0] || {}));
    }
    
    // Try to list all tables in the database
    console.log('Attempting to list all tables...');
    
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
    } else {
      console.log('Tables in the database:', tablesData.map(t => t.tablename));
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

inspectDatabase();
