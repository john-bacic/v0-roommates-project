"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Edit2, Users, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WeeklySchedule } from "@/components/weekly-schedule"
import Link from "next/link"

// Initial users array
const initialUsers = [
  { id: 1, name: "Riko", color: "#BB86FC", initial: "R" },
  { id: 2, name: "Narumi", color: "#03DAC6", initial: "N" },
  { id: 3, name: "John", color: "#CF6679", initial: "J" },
]

export default function Dashboard() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [userName, setUserName] = useState("")
  const [users, setUsers] = useState(initialUsers)
  const [userColor, setUserColor] = useState("#BB86FC") // Default color

  useEffect(() => {
    // Get the user's name from localStorage
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setUserName(storedName)

      // Load user colors from localStorage
      const updatedUsers = [...initialUsers]
      initialUsers.forEach((user, index) => {
        const savedColor = localStorage.getItem(`userColor_${user.name}`)
        if (savedColor) {
          updatedUsers[index] = { ...user, color: savedColor }
        }
      })
      setUsers(updatedUsers)

      // Set the current user's color
      const currentUserColor = updatedUsers.find((u) => u.name === storedName)?.color || "#BB86FC"
      setUserColor(currentUserColor)
    }

    // Add event listener for color changes
    const handleColorChange = (event: StorageEvent) => {
      if (storedName && event.key?.startsWith("userColor_")) {
        const userName = event.key.replace("userColor_", "")
        if (userName === storedName && event.newValue) {
          setUserColor(event.newValue)
        }
      }
    }

    // Add event listener for custom color change events
    const handleCustomColorChange = (event: CustomEvent) => {
      if (storedName && event.detail.userName === storedName) {
        setUserColor(event.detail.color)
      }
    }

    // Listen for storage events (when localStorage changes)
    window.addEventListener("storage", handleColorChange)

    // Listen for our custom event
    window.addEventListener("userColorChange", handleCustomColorChange as EventListener)

    return () => {
      window.removeEventListener("storage", handleColorChange)
      window.removeEventListener("userColorChange", handleCustomColorChange as EventListener)
    }
  }, [])

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

  const previousWeek = () => {
    const prevWeek = new Date(currentWeek)
    prevWeek.setDate(currentWeek.getDate() - 7)
    setCurrentWeek(prevWeek)
  }

  const nextWeek = () => {
    const nextWeek = new Date(currentWeek)
    nextWeek.setDate(currentWeek.getDate() + 7)
    setCurrentWeek(nextWeek)
  }

  // Function to handle color updates from the WeeklySchedule component
  const handleColorUpdate = (name: string, color: string) => {
    if (name === userName) {
      setUserColor(color)
    }

    setUsers((prev) => prev.map((user) => (user.name === name ? { ...user, color } : user)))
  }

  // Determine text color based on background color
  const getTextColor = (bgColor: string) => {
    const lightColors = ["#BB86FC", "#03DAC6", "#FFB74D", "#64B5F6", "#81C784", "#FFD54F"]
    return lightColors.includes(bgColor) ? "#000" : "#fff"
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Main header - always fixed at the top with exact height */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#121212] shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-[57px] px-4">
          {/* Update the header title */}
          <h1 className="text-xl font-bold">Roommate Schedules</h1>

          {/* Add a link to the overview page in the header section */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#A0A0A0]">Hi, {userName || "Friend"}</span>
            <Link href="/roommates">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Users className="h-4 w-4" />
                <span className="sr-only">Roommates</span>
              </Button>
            </Link>
            <Link href="/overview">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
                <span className="sr-only">Overview</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Add padding to account for the fixed header */}
      <main className="flex-1 pt-[57px] p-4 max-w-7xl mx-auto w-full">
        {/* Week navigation - now part of the scrollable content */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Week of {formatWeekRange(currentWeek)}</h2>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={previousWeek} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous week</span>
            </Button>

            <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next week</span>
            </Button>
          </div>
        </div>

        {/* Schedule content */}
        <div className="flex flex-col gap-4">
          <WeeklySchedule users={users} currentWeek={currentWeek} onColorChange={handleColorUpdate} />
        </div>
      </main>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          asChild
          className="rounded-full h-14 w-14"
          style={{
            backgroundColor: userColor,
            color: getTextColor(userColor),
          }}
        >
          <Link href="/schedule/edit">
            <Edit2 className="h-6 w-6" />
            <span className="sr-only">Edit schedule</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
