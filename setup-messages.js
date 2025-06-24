const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupMessagingTables() {
  console.log('Setting up messaging tables...')

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'setup-messages-tables.sql'),
      'utf8'
    )

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })

    if (error) {
      console.error('Error creating messaging tables:', error)

      // If exec_sql doesn't work, try running the SQL directly through the API
      console.log('Trying alternative approach...')

      // You might need to run this SQL directly in the Supabase dashboard
      console.log('\nPlease run the following SQL in your Supabase SQL editor:')
      console.log('File: setup-messages-tables.sql')

      return
    }

    console.log('✅ Messaging tables created successfully!')

    // Verify the tables were created
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1)

    if (messagesError) {
      console.error('Error verifying messages table:', messagesError)
    } else {
      console.log('✅ Messages table verified')
    }

    const { data: reads, error: readsError } = await supabase
      .from('message_reads')
      .select('*')
      .limit(1)

    if (readsError) {
      console.error('Error verifying message_reads table:', readsError)
    } else {
      console.log('✅ Message reads table verified')
    }
  } catch (error) {
    console.error('Setup error:', error)
  }
}

// Run the setup
setupMessagingTables()
