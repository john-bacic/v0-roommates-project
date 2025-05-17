// This script sets up the necessary tables in Supabase and inserts initial data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

// For local development with first Supabase instance
const defaultUrl = 'https://lzfsuovymvkkqdegiurk.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZnN1b3Z5bXZra3FkZWdpdXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzIzNzAsImV4cCI6MjA2MDMwODM3MH0.fpfKpIRbXAQLjaJ7Bz7QYphrUYbwJ8BtfkFrmdq-a6E';

// For production with second Supabase instance
const prodUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const prodKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

// Get Supabase credentials from environment variables or use the fallback values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || prodUrl || defaultUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || prodKey || defaultKey;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    
    // First, check if users table exists
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (usersError && usersError.code === '42P01') {
      console.log('Users table does not exist. Creating tables...');
      
      // Create tables using direct SQL execution
      const createTablesSql = fs.readFileSync(path.join(__dirname, 'direct-setup.sql'), 'utf8');
      const { error: createTablesError } = await supabase.rpc('exec_sql', { sql: createTablesSql });
      
      if (createTablesError) {
        console.error('Error creating tables:', createTablesError);
        return;
      }
      
      console.log('Tables created successfully.');
      
      // Insert initial users
      const initialUsers = [
        { id: 1, name: "Riko", color: "#BB86FC", initial: "R" },
        { id: 2, name: "Narumi", color: "#03DAC6", initial: "N" },
        { id: 3, name: "John", color: "#CF6679", initial: "J" },
      ];
      
      const { error: insertError } = await supabase
        .from('users')
        .insert(initialUsers);
        
      if (insertError) {
        console.error('Error inserting initial users:', insertError);
        return;
      }
      
      console.log('Initial users inserted successfully.');
    } else {
      console.log('Database tables already exist.');
    }
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Setup error:', error);
  }
};

// Run the setup function
setupDatabase();
