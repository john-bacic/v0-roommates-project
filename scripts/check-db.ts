import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Anon Key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    // Check if week_start_date column exists
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_column_info', { 
        table_name: 'schedules',
        column_name: 'week_start_date' 
      });

    if (columnError) {
      console.log('week_start_date column does not exist or there was an error:');
      console.error(columnError);
    } else {
      console.log('week_start_date column exists:', columnInfo);
    }

    // Check some sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('schedules')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
    } else {
      console.log('Sample schedule data:');
      console.log(JSON.stringify(sampleData, null, 2));
    }

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'schedules' });

    if (tableError) {
      console.error('Error getting table info:', tableError);
    } else {
      console.log('Table structure:');
      console.log(JSON.stringify(tableInfo, null, 2));
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabase();
