const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  console.log('Testing Supabase connection...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('Key:', supabaseKey ? 'Set' : 'Missing')

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test users table
    console.log('\nTesting users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      console.error('Users error:', usersError)
    } else {
      console.log('Users found:', users?.length || 0)
      console.log('Users:', users)
    }

    // Test schedules table
    console.log('\nTesting schedules table...')
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .limit(5)

    if (schedulesError) {
      console.error('Schedules error:', schedulesError)
    } else {
      console.log('Schedules found:', schedules?.length || 0)
      console.log('Sample schedules:', schedules)
    }
  } catch (error) {
    console.error('Connection error:', error)
  }
}

testConnection()
