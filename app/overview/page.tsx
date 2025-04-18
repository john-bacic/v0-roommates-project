"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MultiDayView } from "@/components/multi-day-view"

// Sample users data
const users = [
  { id: 1, name: "Riko", color: "#BB86FC", initial: "R" },
  { id: 2, name: "Narumi", color: "#03DAC6", initial: "N" },
  { id: 3, name: "John", color: "#CF6679", initial: "J" },
]

// Sample schedule data
const sampleSchedules: Record<number, Record<string, Array<{ start: string; end: string; label: string }>>> = {
  1: {
    // Riko
    Monday: [
      { start: "9:00", end: "12:00", label: "Class" },
      { start: "14:00", end: "16:00", label: "Work" },
    ],
    Tuesday: [{ start: "9:00", end: "13:00", label: "Class" }],
    Wednesday: [{ start: "13:00", end: "17:00", label: "Work" }],
    Thursday: [
      { start: "9:00", end: "11:00", label: "Class" },
      { start: "15:00", end: "17:00", label: "Study Group" },
    ],
    Friday: [{ start: "11:00", end: "14:00", label: "Work" }],
    Saturday: [],
    Sunday: [],
  },
  2: {
    // Narumi
    Monday: [{ start: "12:00", end: "15:00", label: "Work" }],
    Tuesday: [
      { start: "9:00", end: "11:00", label: "Gym" },
      { start: "15:00", end: "17:00", label: "Work" },
    ],
    Wednesday: [{ start: "9:00", end: "12:00", label: "Work" }],
    Thursday: [{ start: "13:00", end: "16:00", label: "Work" }],
    Friday: [
      { start: "9:00", end: "11:00", label: "Appointment" },
      { start: "14:00", end: "16:00", label: "Work" },
    ],
    Saturday: [{ start: "10:00", end: "12:00", label: "Work" }],
    Sunday: [],
  },
  3: {
    // John
    Monday: [
      { start: "9:00", end: "11:00", label: "Class" },
      { start: "15:00", end: "17:00", label: "Work" },
    ],
    Tuesday: [{ start: "11:00", end: "14:00", label: "Class" }],
    Wednesday: [
      { start: "9:00", end: "11:00", label: "Class" },
      { start: "15:00", end: "17:00", label: "Work" },
    ],
    Thursday: [{ start: "11:00", end: "14:00", label: "Class" }],
    Friday: [{ start: "14:00", end: "17:00", label: "Work" }],
    Saturday: [],
    Sunday: [{ start: "14:00", end: "16:00", label: "Study Group" }],
  },
}

export default function Overview() {
  const [schedules, setSchedules] = useState(sampleSchedules)
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [currentWeek, setCurrentWeek] = useState(new Date())

  useEffect(() => {
    // Try to load schedules from localStorage
    const loadedSchedules = { ...sampleSchedules }

    users.forEach((user) => {
      const savedSchedule = localStorage.getItem(`schedule_${user.name}`)
      if (savedSchedule) {
        try {
          loadedSchedules[user.id] = JSON.parse(savedSchedule)
        } catch (e) {
          console.error(`Failed to parse saved schedule for ${user.name}`)
        }
      }
    })

    setSchedules(loadedSchedules)
  }, [])

  // Format week range with month names
  const formatWeekRange = (date: Date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // End of week (Saturday)

    // Format with month name
    const formatDate = (d: Date) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${monthNames[d.getMonth()]} ${d.getDate()}`
    }

    return `${formatDate(start)} - ${formatDate(end)}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Header - now sticky */}
      <header className="sticky top-0 z-50 border-b border-[#333333] bg-[#121212] p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center text-[#A0A0A0] hover:text-white mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <h1 className="text-xl font-bold">Weekly Overview</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Week of {formatWeekRange(currentWeek)}</h2>
          <p className="text-sm text-[#A0A0A0]">
            View all roommate schedules in a compact timeline format. Toggle between collapsed and detailed views.
          </p>
        </div>

        <div className="bg-[#1E1E1E] rounded-lg p-4">
          <MultiDayView users={users} schedules={schedules} days={days} />
        </div>
      </main>
    </div>
  )
}
