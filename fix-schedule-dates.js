const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixAllScheduleDates() {
  try {
    console.log('Fixing all schedule dates to current week...')

    // Get current week dates
    const today = new Date()
    console.log('Today is:', today.toDateString())

    const dayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }

    // Get all schedules
    const { data: allSchedules, error: fetchError } = await supabase
      .from('schedules')
      .select('*')

    if (fetchError) {
      console.error('Error fetching schedules:', fetchError)
      return
    }

    if (!allSchedules || allSchedules.length === 0) {
      console.log('No schedules found')
      return
    }

    console.log(`Updating ${allSchedules.length} schedules to current week...`)

    // Update each schedule with the appropriate date for current week
    for (const schedule of allSchedules) {
      const dayOffset = dayMap[schedule.day]
      if (dayOffset === undefined) {
        console.warn(`Skipping schedule with invalid day: ${schedule.day}`)
        continue
      }

      // Calculate the date for this day in the current week
      const date = new Date(today)
      date.setDate(today.getDate() - today.getDay() + dayOffset)
      const formattedDate = date.toISOString().split('T')[0]

      const { error: updateError } = await supabase
        .from('schedules')
        .update({ date: formattedDate })
        .eq('id', schedule.id)

      if (updateError) {
        console.error(`Error updating schedule ${schedule.id}:`, updateError)
      } else {
        console.log(
          `Updated ${schedule.day} schedule for user ${schedule.user_id} to date ${formattedDate}`
        )
      }
    }

    console.log('All schedule dates updated to current week!')

    // Verify the updates
    const { data: verifyData, error: verifyError } = await supabase
      .from('schedules')
      .select('user_id, day, date, label')
      .order('user_id', { ascending: true })
      .order('day', { ascending: true })

    if (verifyError) {
      console.error('Error verifying updates:', verifyError)
    } else {
      console.log('\nUpdated schedules:')
      verifyData?.forEach((schedule) => {
        console.log(
          `User ${schedule.user_id} - ${schedule.day}: ${schedule.date} (${schedule.label})`
        )
      })
    }
  } catch (error) {
    console.error('Error fixing schedule dates:', error)
  }
}

fixAllScheduleDates()
