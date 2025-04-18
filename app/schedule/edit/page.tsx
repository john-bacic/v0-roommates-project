"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScheduleEditor } from "@/components/schedule-editor"
import { useRouter } from "next/navigation"

// Add the getTextColor helper function
const getTextColor = (bgColor: string) => {
  const lightColors = ["#BB86FC", "#03DAC6", "#FFB74D", "#64B5F6", "#81C784", "#FFD54F"]
  return lightColors.includes(bgColor) ? "#000" : "#fff"
}

interface TimeBlock {
  start: string
  end: string
  label: string
}

// Update the component to include userColor state
export default function EditSchedule() {
  const [userName, setUserName] = useState("")
  const [userColor, setUserColor] = useState("#BB86FC") // Default color
  const router = useRouter()
  const [schedule, setSchedule] = useState<Record<string, TimeBlock[]>>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  })

  useEffect(() => {
    // Get the user's name from localStorage
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      // Check if the name is one of the roommates
      if (["Riko", "Narumi", "John"].includes(storedName)) {
        setUserName(storedName)

        // Get the user's color from localStorage
        const savedColor = localStorage.getItem(`userColor_${storedName}`)
        if (savedColor) {
          setUserColor(savedColor)
        } else {
          // Set default colors based on user
          if (storedName === "Riko") setUserColor("#BB86FC")
          else if (storedName === "Narumi") setUserColor("#03DAC6")
          else if (storedName === "John") setUserColor("#CF6679")
        }
      } else {
        // If not a roommate, redirect to home page
        router.push("/")
      }
    } else {
      // If no name is set, redirect to home page
      router.push("/")
    }

    // Load existing schedule if available
    const savedSchedule = localStorage.getItem(`schedule_${storedName}`)
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule))
      } catch (e) {
        console.error("Failed to parse saved schedule")
        // Set default schedule based on the user
        if (storedName === "Riko") {
          setSchedule({
            Monday: [
              { start: "09:00", end: "12:00", label: "Class" },
              { start: "14:00", end: "16:00", label: "Work" },
            ],
            Tuesday: [{ start: "09:00", end: "13:00", label: "Class" }],
            Wednesday: [{ start: "13:00", end: "17:00", label: "Work" }],
            Thursday: [
              { start: "09:00", end: "11:00", label: "Class" },
              { start: "15:00", end: "17:00", label: "Study Group" },
            ],
            Friday: [{ start: "11:00", end: "14:00", label: "Work" }],
            Saturday: [],
            Sunday: [],
          })
        } else if (storedName === "Narumi") {
          setSchedule({
            Monday: [{ start: "12:00", end: "15:00", label: "Work" }],
            Tuesday: [
              { start: "09:00", end: "11:00", label: "Gym" },
              { start: "15:00", end: "17:00", label: "Work" },
            ],
            Wednesday: [{ start: "09:00", end: "12:00", label: "Work" }],
            Thursday: [{ start: "13:00", end: "16:00", label: "Work" }],
            Friday: [
              { start: "09:00", end: "11:00", label: "Appointment" },
              { start: "14:00", end: "16:00", label: "Work" },
            ],
            Saturday: [{ start: "10:00", end: "12:00", label: "Work" }],
            Sunday: [],
          })
        } else if (storedName === "John") {
          setSchedule({
            Monday: [
              { start: "09:00", end: "11:00", label: "Class" },
              { start: "15:00", end: "17:00", label: "Work" },
            ],
            Tuesday: [{ start: "11:00", end: "14:00", label: "Class" }],
            Wednesday: [
              { start: "09:00", end: "11:00", label: "Class" },
              { start: "15:00", end: "17:00", label: "Work" },
            ],
            Thursday: [{ start: "11:00", end: "14:00", label: "Class" }],
            Friday: [{ start: "14:00", end: "17:00", label: "Work" }],
            Saturday: [],
            Sunday: [{ start: "14:00", end: "16:00", label: "Study Group" }],
          })
        }
      }
    }

    // Add event listener for custom color change events
    const handleCustomColorChange = (event: CustomEvent) => {
      if (storedName && event.detail.userName === storedName) {
        setUserColor(event.detail.color)
      }
    }

    // Listen for our custom event
    window.addEventListener("userColorChange", handleCustomColorChange as EventListener)

    return () => {
      window.removeEventListener("userColorChange", handleCustomColorChange as EventListener)
    }
  }, [router])

  const handleSave = () => {
    // Save schedule to localStorage
    if (userName) {
      localStorage.setItem(`schedule_${userName}`, JSON.stringify(schedule))
      router.push("/dashboard")
    }
  }

  const handleScheduleChange = (newSchedule: Record<string, TimeBlock[]>) => {
    setSchedule(newSchedule)
  }

  // Get current week date range
  const formatWeekRange = () => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)

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
      {/* Header */}
      <header className="border-b border-[#333333] p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center text-[#A0A0A0] hover:text-white mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <h1 className="text-xl font-bold">Edit Your Schedule</h1>
          </div>

          <Button
            onClick={handleSave}
            style={{ backgroundColor: userColor, color: getTextColor(userColor) }}
            className="hover:opacity-90"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Week of {formatWeekRange()}</h2>
          <p className="text-sm text-[#A0A0A0]">Add your working hours or times when you'll be out</p>
        </div>

        <div className="bg-[#1E1E1E] rounded-lg p-4">
          <ScheduleEditor schedule={schedule} onChange={handleScheduleChange} userColor={userColor} />
        </div>
      </main>
    </div>
  )
}
