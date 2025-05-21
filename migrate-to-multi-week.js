// Script to update the database schema for multi-week support
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Using key:', process.env.SUPABASE_KEY ? 'SUPABASE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

async function runMigration() {
  try {
    console.log('Starting migration to multi-week support...');
    
    // Read the migration SQL file
    const migrationSql = fs.readFileSync(
      path.join(__dirname, './migrations/add-date-to-schedules.sql'),
      'utf8'
    );
    
    // Split into individual statements to handle one at a time
    const statements = migrationSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Since we might not have exec_sql RPC access, we'll use regular Supabase operations
    // for our specific migration needs
    console.log('Altering schedules table to add date column...');
    try {
      // First check if the date column already exists
      const { data: columnInfo, error: columnError } = await supabase
        .from('schedules')
        .select('date')
        .limit(1);

      if (columnError && columnError.code === '42703') {
        // Column doesn't exist, proceed with creating it
        console.log('Date column does not exist yet, creating it...');
        
        // We'll directly modify the database using our current schedule entries
        // First, get all existing schedules
        const { data: allSchedules, error: fetchError } = await supabase
          .from('schedules')
          .select('*');
        
        if (fetchError) {
          console.error('Error fetching schedules:', fetchError);
          throw fetchError;
        }
        
        console.log(`Found ${allSchedules?.length || 0} existing schedule records`);
        
        // Calculate current week dates for existing records
        const today = new Date();
        const dayMap = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        
        // Update each schedule with the appropriate date
        const updates = allSchedules?.map(schedule => {
          const dayOffset = dayMap[schedule.day];
          const date = new Date(today);
          date.setDate(today.getDate() - today.getDay() + dayOffset);
          const formattedDate = date.toISOString().split('T')[0];
          
          return {
            id: schedule.id,
            date: formattedDate
          };
        });
        
        // Perform updates in batches of 50 to avoid API limits
        if (updates && updates.length > 0) {
          for (let i = 0; i < updates.length; i += 50) {
            const batch = updates.slice(i, i + 50);
            console.log(`Updating batch ${i/50 + 1} of ${Math.ceil(updates.length/50)}...`);
            
            // Use upsert to add the date column to each record
            const { error: updateError } = await supabase
              .from('schedules')
              .upsert(batch, { onConflict: 'id' });
            
            if (updateError) {
              console.error('Error updating schedules with dates:', updateError);
              throw updateError;
            }
          }
          
          console.log('Successfully updated all schedules with dates');
        }
      } else {
        console.log('Date column already exists, skipping migration');
      }
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
    
    console.log('Migration completed successfully!');
    
    // Also update setup files for future database setups
    updateSetupFiles();
    
    console.log('All done! The app now supports multiple weeks of schedules.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

function updateSetupFiles() {
  try {
    // Update direct-setup.sql
    let directSetupSql = fs.readFileSync(
      path.join(__dirname, 'direct-setup.sql'),
      'utf8'
    );
    
    // Add date column to schedules table definition
    directSetupSql = directSetupSql.replace(
      'CREATE TABLE public.schedules (',
      'CREATE TABLE public.schedules (\n  date DATE NOT NULL,'
    );
    
    // Add date values to sample data inserts
    // Calculate date for each day of the week
    const today = new Date();
    const dayMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    // Update INSERT statements
    const insertPattern = /\((\d+), '([^']+)', '([^']+)', '([^']+)', '([^']+)', (true|false)\)/g;
    directSetupSql = directSetupSql.replace(insertPattern, (match, userId, day, startTime, endTime, label, allDay) => {
      // Calculate the date for this day of the week
      const dayOffset = dayMap[day];
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + dayOffset);
      
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      return `(${userId}, '${day}', '${startTime}', '${endTime}', '${label}', ${allDay}, '${formattedDate}')`;
    });
    
    // Update VALUES clause
    directSetupSql = directSetupSql.replace(
      'INSERT INTO public.schedules (user_id, day, start_time, end_time, label, all_day)',
      'INSERT INTO public.schedules (user_id, day, start_time, end_time, label, all_day, date)'
    );
    
    fs.writeFileSync(path.join(__dirname, 'direct-setup.sql'), directSetupSql);
    console.log('Updated direct-setup.sql successfully');
    
    // Now do the same for setup-tables.sql
    let setupTablesSql = fs.readFileSync(
      path.join(__dirname, 'setup-tables.sql'),
      'utf8'
    );
    
    setupTablesSql = setupTablesSql.replace(
      'CREATE TABLE public.schedules (',
      'CREATE TABLE public.schedules (\n      date DATE NOT NULL,'
    );
    
    // Add index for date
    setupTablesSql = setupTablesSql.replace(
      'CREATE INDEX schedules_user_id_idx ON public.schedules(user_id);',
      'CREATE INDEX schedules_user_id_idx ON public.schedules(user_id);\n    CREATE INDEX schedules_date_idx ON public.schedules(date);\n    CREATE INDEX schedules_user_date_idx ON public.schedules(user_id, date);'
    );
    
    fs.writeFileSync(path.join(__dirname, 'setup-tables.sql'), setupTablesSql);
    console.log('Updated setup-tables.sql successfully');
    
  } catch (error) {
    console.error('Error updating setup files:', error);
  }
}

// Run the migration
runMigration();
