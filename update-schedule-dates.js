// Script to update existing schedule records with date values
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Using key:', process.env.SUPABASE_KEY ? 'SUPABASE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

async function updateScheduleDates() {
  try {
    // First, let's check if the date column exists
    let columnExists = false;
    try {
      // This will fail if the column doesn't exist
      const { data: columnCheck, error } = await supabase
        .from('schedules')
        .select('date')
        .limit(1);
      
      if (!error) {
        columnExists = true;
        console.log('Date column already exists in schedules table');
      }
    } catch (e) {
      console.log('Date column doesn\'t exist yet, will try to add it');
    }

    // If the column doesn't exist, we need to add it via SQL
    if (!columnExists) {
      console.log('Adding date column to schedules table...');
      
      // We can't use the RPC method directly, so we'll use a different approach
      // For Supabase, we need to run this from SQL editor in the dashboard
      console.log('Please run this SQL in the Supabase SQL Editor:');
      console.log('ALTER TABLE public.schedules ADD COLUMN date DATE;');
      
      // Prompt to continue after manual SQL execution
      console.log('\nPlease run the SQL above in Supabase dashboard, then restart this script.');
      process.exit(0);
    }

    // Now fetch schedules that have a valid user_id and day
    console.log('Fetching valid schedules...');
    const { data: validSchedules, error: fetchError } = await supabase
      .from('schedules')
      .select('id, user_id, day')
      .not('user_id', 'is', null)
      .not('day', 'is', null);

    if (fetchError) {
      console.error('Error fetching schedules:', fetchError);
      throw fetchError;
    }

    if (!validSchedules || validSchedules.length === 0) {
      console.log('No valid schedules found, nothing to update.');
      return;
    }

    console.log(`Found ${validSchedules.length} valid schedules to update with dates`);

    // Calculate current week dates for existing records
    const today = new Date();
    const dayMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    // Create updates for valid schedules only
    const updates = validSchedules.map(schedule => {
      const dayOffset = dayMap[schedule.day];
      if (dayOffset === undefined) {
        console.warn(`Warning: Schedule ${schedule.id} has invalid day: ${schedule.day}`);
        return null;
      }
      
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + dayOffset);
      const formattedDate = date.toISOString().split('T')[0];
      
      return {
        id: schedule.id,
        date: formattedDate
      };
    }).filter(Boolean); // Remove null entries

    // Perform updates in smaller batches of 10 to avoid issues
    if (updates.length > 0) {
      console.log(`Preparing to update ${updates.length} schedule dates`);
      
      // Update one record at a time to be safe
      let successCount = 0;
      let errorCount = 0;
      
      for (const update of updates) {
        try {
          const { error } = await supabase
            .from('schedules')
            .update({ date: update.date })
            .eq('id', update.id);
            
          if (error) {
            console.error(`Error updating schedule ${update.id}:`, error);
            errorCount++;
          } else {
            successCount++;
            if (successCount % 5 === 0) {
              console.log(`Progress: ${successCount}/${updates.length} schedules updated`);
            }
          }
        } catch (e) {
          console.error(`Exception updating schedule ${update.id}:`, e);
          errorCount++;
        }
      }
      
      console.log(`Update complete. Success: ${successCount}, Errors: ${errorCount}`);
    }

    // Verify the updates
    const { data: verifyData, error: verifyError } = await supabase
      .from('schedules')
      .select('id, day, date')
      .limit(5);
    
    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
    } else {
      console.log('Sample of updated records:');
      console.table(verifyData);
    }
  } catch (error) {
    console.error('Failed to update schedule dates:', error);
  }
}

updateScheduleDates();
