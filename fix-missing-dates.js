// Script to fix schedules with missing dates
// This script will update all schedules that don't have a date field set
// It will set the date based on the day of the week

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { format, addDays, subDays } = require('date-fns');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Read the .env.local file directly if it exists
let supabaseUrl;
let supabaseKey;

try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseKey = line.split('=')[1].trim();
      }
    }
  }
} catch (err) {
  console.error('Error reading .env.local file:', err);
}

// Fallback to process.env if not found in .env.local
supabaseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
supabaseKey = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env.local or .env file.');
  process.exit(1);
}

console.log('Connecting to Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingDates() {
  try {
    console.log('Starting to fix schedules with missing dates...');

    // Get all schedules
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*');

    if (error) {
      throw error;
    }

    console.log(`Found ${schedules.length} total schedules`);

    // Get current date
    const today = new Date();
    
    // Map of day names to their index (0 = Sunday, 1 = Monday, etc.)
    const dayIndices = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    // Filter schedules with missing or null dates
    const schedulesWithMissingDates = schedules.filter(schedule => !schedule.date);
    console.log(`Found ${schedulesWithMissingDates.length} schedules with missing dates`);

    // Group schedules by user_id
    const schedulesByUser = {};
    schedulesWithMissingDates.forEach(schedule => {
      if (!schedulesByUser[schedule.user_id]) {
        schedulesByUser[schedule.user_id] = [];
      }
      schedulesByUser[schedule.user_id].push(schedule);
    });

    // Process each user's schedules
    for (const userId in schedulesByUser) {
      const userSchedules = schedulesByUser[userId];
      console.log(`Processing ${userSchedules.length} schedules for user ${userId}`);

      // Get user info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error(`Error fetching user ${userId}:`, userError);
        continue;
      }

      const userName = userData.name;
      console.log(`User: ${userName} (ID: ${userId})`);

      // Calculate dates for each day of the current week
      const currentWeek = {};
      const todayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Calculate the date for each day of the current week
      for (const day in dayIndices) {
        const dayIndex = dayIndices[day];
        const daysToAdjust = dayIndex - todayIndex;
        const date = addDays(today, daysToAdjust);
        currentWeek[day] = format(date, 'yyyy-MM-dd');
      }

      // Also add dates for the previous week
      const previousWeek = {};
      for (const day in dayIndices) {
        previousWeek[day] = format(subDays(new Date(currentWeek[day]), 7), 'yyyy-MM-dd');
      }

      // Update each schedule with the appropriate date
      for (const schedule of userSchedules) {
        // Use current week's date by default
        let dateToUse = currentWeek[schedule.day];

        // For John's schedules for today, yesterday, and day before yesterday, make sure they're in the current week
        if (userName === 'John') {
          const todayStr = format(today, 'yyyy-MM-dd');
          const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
          const dayBeforeYesterdayStr = format(subDays(today, 2), 'yyyy-MM-dd');

          // Map the day names to their dates
          const specialDays = {
            [format(today, 'EEEE')]: todayStr,
            [format(subDays(today, 1), 'EEEE')]: yesterdayStr,
            [format(subDays(today, 2), 'EEEE')]: dayBeforeYesterdayStr
          };

          // If this schedule is for one of the special days, use that date
          if (specialDays[schedule.day]) {
            dateToUse = specialDays[schedule.day];
            console.log(`Setting special date for ${userName}'s ${schedule.day} schedule: ${dateToUse}`);
          }
        }

        // Update the schedule with the calculated date
        const { error: updateError } = await supabase
          .from('schedules')
          .update({ date: dateToUse })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`Error updating schedule ${schedule.id}:`, updateError);
        } else {
          console.log(`Updated schedule ${schedule.id} for ${schedule.day} with date ${dateToUse}`);
        }
      }
    }

    console.log('Finished fixing schedules with missing dates.');
  } catch (error) {
    console.error('Error fixing missing dates:', error);
  }
}

// Run the function
fixMissingDates();
