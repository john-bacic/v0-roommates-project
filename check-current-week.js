// Check what week the dashboard should be loading
const today = new Date()
console.log('Today:', today.toDateString())
console.log('Today ISO:', today.toISOString().split('T')[0])

// Calculate week start (Sunday)
const weekStart = new Date(today)
weekStart.setDate(today.getDate() - today.getDay())
weekStart.setHours(0, 0, 0, 0)

const weekEnd = new Date(weekStart)
weekEnd.setDate(weekStart.getDate() + 6)

console.log('Current week start (Sunday):', weekStart.toDateString())
console.log('Current week end (Saturday):', weekEnd.toDateString())
console.log('Week start ISO:', weekStart.toISOString().split('T')[0])
console.log('Week end ISO:', weekEnd.toISOString().split('T')[0])

// Check what schedules exist for this week
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkSchedulesForCurrentWeek() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('\nChecking schedules for current week...')

  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .gte('date', weekStart.toISOString().split('T')[0])
    .lte('date', weekEnd.toISOString().split('T')[0])

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Schedules found for current week:', schedules?.length || 0)
    if (schedules && schedules.length > 0) {
      schedules.forEach((s) => {
        console.log(
          `- ${s.day}: ${s.label} (${s.start_time}-${s.end_time}) [date: ${s.date}]`
        )
      })
    }
  }

  // Also check schedules with null dates
  console.log('\nChecking schedules with null dates...')
  const { data: nullDateSchedules, error: nullError } = await supabase
    .from('schedules')
    .select('*')
    .is('date', null)

  if (nullError) {
    console.error('Error:', nullError)
  } else {
    console.log('Schedules with null dates:', nullDateSchedules?.length || 0)
    if (nullDateSchedules && nullDateSchedules.length > 0) {
      nullDateSchedules.forEach((s) => {
        console.log(`- ${s.day}: ${s.label} (${s.start_time}-${s.end_time})`)
      })
    }
  }
}

checkSchedulesForCurrentWeek()
