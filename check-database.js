const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkDatabase() {
  try {
    console.log('Checking database schedules...')

    // Get all schedules
    const { data: allSchedules, error } = await supabase
      .from('schedules')
      .select('*')
      .order('user_id', { ascending: true })

    if (error) {
      console.error('Error fetching schedules:', error)
      return
    }

    console.log(`Found ${allSchedules?.length || 0} total schedules`)

    if (allSchedules && allSchedules.length > 0) {
      console.log('\nFirst few schedules:')
      allSchedules.slice(0, 5).forEach((schedule) => {
        console.log({
          id: schedule.id,
          user_id: schedule.user_id,
          day: schedule.day,
          date: schedule.date,
          label: schedule.label,
        })
      })

      // Check if any schedules are missing dates
      const schedulesWithoutDates = allSchedules.filter((s) => !s.date)
      console.log(`\nSchedules without dates: ${schedulesWithoutDates.length}`)

      // Check date distribution
      const dateGroups = {}
      allSchedules.forEach((schedule) => {
        const date = schedule.date || 'null'
        if (!dateGroups[date]) {
          dateGroups[date] = 0
        }
        dateGroups[date]++
      })

      console.log('\nDate distribution:')
      Object.entries(dateGroups).forEach(([date, count]) => {
        console.log(`  ${date}: ${count} schedules`)
      })

      // If we have schedules without dates, fix them
      if (schedulesWithoutDates.length > 0) {
        console.log('\nFixing schedules without dates...')
        await fixScheduleDates()
      }
    }
  } catch (error) {
    console.error('Error checking database:', error)
  }
}

async function fixScheduleDates() {
  try {
    // Get current week dates
    const today = new Date()
    const dayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }

    // Get all schedules without dates
    const { data: schedulesWithoutDates, error: fetchError } = await supabase
      .from('schedules')
      .select('*')
      .is('date', null)

    if (fetchError) {
      console.error('Error fetching schedules without dates:', fetchError)
      return
    }

    if (!schedulesWithoutDates || schedulesWithoutDates.length === 0) {
      console.log('No schedules need date fixes')
      return
    }

    console.log(`Fixing ${schedulesWithoutDates.length} schedules...`)

    // Update each schedule with the appropriate date
    for (const schedule of schedulesWithoutDates) {
      const dayOffset = dayMap[schedule.day]
      if (dayOffset === undefined) {
        console.warn(`Skipping schedule with invalid day: ${schedule.day}`)
        continue
      }

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
          `Updated schedule ${schedule.id} with date ${formattedDate}`
        )
      }
    }

    console.log('Date fixes completed!')
  } catch (error) {
    console.error('Error fixing schedule dates:', error)
  }
}

checkDatabase()
