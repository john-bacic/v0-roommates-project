// Simple script to check database schema
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or Anon Key in environment variables');
  console.log('Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check if week_start_date column exists
    const { data: columnCheck, error: columnError } = await supabase
      .from('schedules')
      .select('week_start_date')
      .limit(1);

    if (columnError) {
      console.log('❌ week_start_date column does not exist or there was an error:');
      console.error(columnError);
    } else {
      console.log('✅ week_start_date column exists in the schedules table');
    }

    // Get table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'schedules' })
      .select('*');

    if (tableError) {
      console.log('\nTable structure (using fallback method):');
      // Fallback method if RPC is not available
      const { data: sampleData, error: sampleError } = await supabase
        .from('schedules')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error fetching sample data:', sampleError);
      } else if (sampleData && sampleData.length > 0) {
        console.log('Sample row structure:');
        console.log(JSON.stringify(sampleData[0], null, 2));
      }
    } else {
      console.log('\nTable structure:');
      console.log(JSON.stringify(tableInfo, null, 2));
    }

    // Check if we can query the schedules table
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(3);

    if (schedulesError) {
      console.error('Error querying schedules:', schedulesError);
    } else {
      console.log('\nSample schedule data:');
      console.log(JSON.stringify(schedules, null, 2));
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSchema();
