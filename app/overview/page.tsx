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

// Sample schedule data - matches the WeeklySchedule component's data
const sampleSchedules: Record<number, Record<string, Array<{ start: string; end: string; label: string; allDay?: boolean }>>> = {
  1: {
    // Riko - Updated schedule
    Monday: [{ start: "16:00", end: "23:00", label: "Work" }],
    Tuesday: [{ start: "17:00", end: "22:00", label: "Work" }],
    Wednesday: [{ start: "12:00", end: "22:00", label: "Work" }],
    Thursday: [{ start: "12:00", end: "23:00", label: "Work" }],
    Friday: [{ start: "17:00", end: "23:30", label: "Work" }],
    Saturday: [{ start: "17:00", end: "23:30", label: "Work" }],
    Sunday: [{ start: "16:00", end: "22:00", label: "Work" }],
  },
  2: {
    // Narumi - Updated schedule
    Monday: [{ start: "10:00", end: "19:45", label: "Work" }],
    Tuesday: [{ start: "00:00", end: "23:59", label: "Day off", allDay: true }],
    Wednesday: [{ start: "00:00", end: "23:59", label: "Day off", allDay: true }],
    Thursday: [{ start: "10:00", end: "19:45", label: "Work" }],
    Friday: [{ start: "00:00", end: "23:59", label: "Day off", allDay: true }],
    Saturday: [{ start: "06:00", end: "18:45", label: "Work" }],
    Sunday: [{ start: "11:00", end: "19:45", label: "Work" }],
  },
  3: {
    // John - Updated schedule
    Monday: [{ start: "09:00", end: "17:00", label: "Work" }],
    Tuesday: [{ start: "09:00", end: "21:00", label: "Work" }],
    Wednesday: [{ start: "09:00", end: "17:00", label: "Work" }],
    Thursday: [{ start: "09:00", end: "17:00", label: "Work" }],
    Friday: [{ start: "00:00", end: "23:59", label: "Day off", allDay: true }],
    Saturday: [{ start: "00:00", end: "23:59", label: "Out of town", allDay: true }],
    Sunday: [{ start: "00:00", end: "23:59", label: "Out of town", allDay: true }],
  },
}

export default function Overview() {
  // Initialize users state with the initial users data
  const [usersList, setUsersList] = useState<typeof users>(users)
  const [schedules, setSchedules] = useState(sampleSchedules)
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [currentWeek, setCurrentWeek] = useState(new Date())

  useEffect(() => {
    // Try to load schedules from localStorage
    const loadedSchedules = { ...sampleSchedules }

    // Load user colors from localStorage
    const updatedUsers = [...usersList]
    usersList.forEach((user, index) => {
      // Update user colors
      const savedColor = localStorage.getItem(`userColor_${user.name}`)
      if (savedColor) {
        updatedUsers[index] = { ...user, color: savedColor }
      }

      // Load user schedules
      const savedSchedule = localStorage.getItem(`schedule_${user.name}`)
      if (savedSchedule) {
        try {
          loadedSchedules[user.id] = JSON.parse(savedSchedule)
        } catch (e) {
          console.error(`Failed to parse saved schedule for ${user.name}`)
        }
      }
    })

    // Update both users and schedules
    setUsersList(updatedUsers)
    setSchedules(loadedSchedules)

    // Add event listener for real-time updates
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith("userColor_")) {
        // Handle color changes
        const userName = event.key.replace("userColor_", "")
        const userToUpdate = updatedUsers.find(u => u.name === userName)
        if (userToUpdate && event.newValue) {
          setUsersList(prev => prev.map(u => 
            u.name === userName ? { ...u, color: event.newValue! } : u
          ))
        }
      } else if (event.key?.startsWith("schedule_")) {
        // Handle schedule changes
        const userName = event.key.replace("schedule_", "")
        const userToUpdate = updatedUsers.find(u => u.name === userName)
        if (userToUpdate && event.newValue) {
          try {
            setSchedules(prev => ({
              ...prev,
              [userToUpdate.id]: JSON.parse(event.newValue!)
            }))
          } catch (e) {
            console.error(`Failed to parse updated schedule for ${userName}`)
          }
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
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
            <div className="flex items-center group">
              <Link href="/dashboard" className="flex items-center text-[#A0A0A0] group-hover:text-white mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mx-2 text-[#A0A0A0] group-hover:text-white transition-colors duration-200"
              >
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </div>
            <h1 className="text-xl font-bold">
              Weekly Overview
            </h1>
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
          <MultiDayView users={usersList} schedules={schedules} days={days} />
        </div>
      </main>
    </div>
  )
}
