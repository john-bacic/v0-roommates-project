"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"
import { QuickScheduleModal } from "@/components/quick-schedule-modal"
import { TimeBlockList } from "@/components/time-block-list"

// Sample schedule data for each roommate
const roommates = [
  { id: "1", name: "Riko", color: "#BB86FC", initial: "R" },
  { id: "2", name: "Narumi", color: "#03DAC6", initial: "N" },
  { id: "3", name: "John", color: "#CF6679", initial: "J" },
]

const sampleSchedules: Record<
  string,
  Record<string, Array<{ id?: string; start: string; end: string; label: string }>>
> = {
  "1": {
    // Riko
    Monday: [
      { id: "r-mon-1", start: "9:00", end: "12:00", label: "Class" },
      { id: "r-mon-2", start: "14:00", end: "16:00", label: "Work" },
    ],
    Tuesday: [{ id: "r-tue-1", start: "9:00", end: "13:00", label: "Class" }],
    Wednesday: [{ id: "r-wed-1", start: "13:00", end: "17:00", label: "Work" }],
    Thursday: [
      { id: "r-thu-1", start: "9:00", end: "11:00", label: "Class" },
      { id: "r-thu-2", start: "15:00", end: "17:00", label: "Study Group" },
    ],
    Friday: [{ id: "r-fri-1", start: "11:00", end: "14:00", label: "Work" }],
    Saturday: [],
    Sunday: [],
  },
  "2": {
    // Narumi
    Monday: [{ id: "n-mon-1", start: "12:00", end: "15:00", label: "Work" }],
    Tuesday: [
      { id: "n-tue-1", start: "9:00", end: "11:00", label: "Gym" },
      { id: "n-tue-2", start: "15:00", end: "17:00", label: "Work" },
    ],
    Wednesday: [{ id: "n-wed-1", start: "9:00", end: "12:00", label: "Work" }],
    Thursday: [{ id: "n-thu-1", start: "13:00", end: "16:00", label: "Work" }],
    Friday: [
      { id: "n-fri-1", start: "9:00", end: "11:00", label: "Appointment" },
      { id: "n-fri-2", start: "14:00", end: "16:00", label: "Work" },
    ],
    Saturday: [{ id: "n-sat-1", start: "10:00", end: "12:00", label: "Work" }],
    Sunday: [],
  },
  "3": {
    // John
    Monday: [
      { id: "j-mon-1", start: "9:00", end: "11:00", label: "Class" },
      { id: "j-mon-2", start: "15:00", end: "17:00", label: "Work" },
    ],
    Tuesday: [{ id: "j-tue-1", start: "11:00", end: "14:00", label: "Class" }],
    Wednesday: [
      { id: "j-wed-1", start: "9:00", end: "11:00", label: "Class" },
      { id: "j-wed-2", start: "15:00", end: "17:00", label: "Work" },
    ],
    Thursday: [{ id: "j-thu-1", start: "11:00", end: "14:00", label: "Class" }],
    Friday: [{ id: "j-fri-1", start: "14:00", end: "17:00", label: "Work" }],
    Saturday: [],
    Sunday: [{ id: "j-sun-1", start: "14:00", end: "16:00", label: "Study Group" }],
  },
}

interface TimeBlock {
  id?: string
  start: string
  end: string
  label: string
  allDay?: boolean
}

export default function DayView() {
  const params = useParams()
  const router = useRouter()
  const [roommate, setRoommate] = useState<{ id: string; name: string; color: string; initial: string } | null>(null)
  const [schedule, setSchedule] = useState<Record<string, Array<TimeBlock>> | null>(null)
  const [day, setDay] = useState<string>("")

  // State for quick schedule modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | undefined>(undefined)

  // Get current user name from localStorage
  const [currentUserName, setCurrentUserName] = useState("")

  // Add a state for tracking screen width
  const [screenWidth, setScreenWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024)

  // Add hours array and functions for time display
  const hours = Array.from({ length: 19 }, (_, i) => i + 6) // 6 to 24 (midnight)

  // Format hour based on selected format (add this if it doesn't exist)
  const [use24HourFormat, setUse24HourFormat] = useState(false) // Assuming a default value of false

  const formatHour = (hour: number): string => {
    if (use24HourFormat) {
      return hour === 24 ? "00:00" : `${hour}:00`
    } else {
      if (hour === 0 || hour === 24) {
        return "12AM"
      }
      const period = hour >= 12 ? "PM" : "AM"
      const displayHour = hour > 12 ? hour - 12 : hour
      return `${displayHour}${period}`
    }
  }

  // Add a function to determine which hours to display based on screen width
  const getVisibleHours = () => {
    // On very small screens, only show every 4 hours
    if (screenWidth < 400) {
      return hours.filter((hour) => hour % 4 === 6)
    }
    // On small screens, show every 3 hours
    else if (screenWidth < 600) {
      return hours.filter((hour) => hour % 3 === 0)
    }
    // On medium screens, show every 2 hours
    else if (screenWidth < 900) {
      return hours.filter((hour) => hour % 2 === 0)
    }
    // On desktop, show all hours
    return hours
  }

  useEffect(() => {
    const id = params.id as string
    const dayParam = params.day as string

    // Convert day parameter to proper case (e.g., "monday" to "Monday")
    const formattedDay = dayParam.charAt(0).toUpperCase() + dayParam.slice(1).toLowerCase()

    // Check if the day is valid
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    if (!validDays.includes(formattedDay)) {
      router.push("/dashboard")
      return
    }

    setDay(formattedDay)

    const found = roommates.find((r) => r.id === id)
    if (!found) {
      router.push("/dashboard")
      return
    }

    setRoommate(found)

    // Get current user name
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setCurrentUserName(storedName)
    }

    // Get schedule from localStorage or use sample data
    const savedSchedule = localStorage.getItem(`schedule_${found.name}`)
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule))
      } catch (e) {
        setSchedule(sampleSchedules[id])
      }
    } else {
      setSchedule(sampleSchedules[id])
    }

    // Function to update screen width
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [params.id, params.day, router])

  // Handle opening the modal when clicking on the + button
  const handleAddClick = () => {
    if (roommate && roommate.name === currentUserName) {
      setEditMode(false)
      setSelectedTimeBlock(undefined)
      setModalOpen(true)
    }
  }

  // Handle opening the modal when clicking on a time block
  const handleEditBlock = (day: string, timeBlock: TimeBlock) => {
    if (roommate && roommate.name === currentUserName) {
      setEditMode(true)
      setSelectedTimeBlock(timeBlock)
      setModalOpen(true)
    }
  }

  // Handle saving the schedule from the modal
  const handleSaveSchedule = (day: string, timeBlock: TimeBlock) => {
    if (!roommate || !schedule) return

    const newSchedule = { ...schedule }

    // Make sure the day exists in the schedule
    if (!newSchedule[day]) {
      newSchedule[day] = []
    }

    if (editMode && selectedTimeBlock?.id) {
      // Update existing time block
      const index = newSchedule[day].findIndex((block) => block.id === selectedTimeBlock.id)
      if (index !== -1) {
        newSchedule[day][index] = timeBlock
      }
    } else {
      // Add the new time block with a unique ID if it doesn't have one
      if (!timeBlock.id) {
        timeBlock.id = crypto.randomUUID()
      }

      // Add the new time block
      newSchedule[day].push(timeBlock)

      // Sort the time blocks by start time
      newSchedule[day].sort((a, b) => {
        const aTime = a.start.split(":").map(Number)
        const bTime = b.start.split(":").map(Number)
        return aTime[0] * 60 + aTime[1] - (bTime[0] * 60 + bTime[1])
      })
    }

    // Update state
    setSchedule(newSchedule)

    // Save to localStorage
    localStorage.setItem(`schedule_${roommate.name}`, JSON.stringify(newSchedule))
  }

  // Handle deleting a time block
  const handleDeleteTimeBlock = (day: string, timeBlockId: string) => {
    if (!roommate || !schedule) return

    const newSchedule = { ...schedule }

    // Filter out the time block with the matching ID
    if (newSchedule[day]) {
      if (timeBlockId === "current" && selectedTimeBlock) {
        // If we're deleting the currently selected time block without an ID
        newSchedule[day] = newSchedule[day].filter((block) => block !== selectedTimeBlock)
      } else {
        // Normal case - filter by ID
        newSchedule[day] = newSchedule[day].filter((block) => block.id !== timeBlockId)
      }

      // Update state
      setSchedule(newSchedule)

      // Save to localStorage
      localStorage.setItem(`schedule_${roommate.name}`, JSON.stringify(newSchedule))
    }
  }

  if (!roommate || !schedule || !day) {
    return <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">Loading...</div>
  }

  const isCurrentUser = roommate.name === currentUserName
  const daySchedule = schedule[day] || []

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="border-b border-[#333333] p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link
              href={`/schedule/view/${roommate.id}`}
              className="flex items-center text-[#A0A0A0] hover:text-white mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Weekly View
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isCurrentUser ? "ring-2 ring-offset-2 ring-offset-[#121212] ring-[#444444]" : ""}`}
              style={{ backgroundColor: roommate.color, color: "#000" }}
            >
              {roommate.initial}
            </div>
            <div>
              <h1 className="text-xl font-bold">{day}</h1>
              <p className="text-sm text-[#A0A0A0]">
                {roommate.name}'s Schedule {isCurrentUser && "(You)"}
              </p>
            </div>
          </div>

          {isCurrentUser && (
            <Button onClick={handleAddClick} className="bg-[#BB86FC] hover:bg-[#A66DF7] text-black">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Block
            </Button>
          )}
        </div>

        <div className="bg-[#1E1E1E] rounded-lg p-4">
          <TimeBlockList
            day={day}
            timeBlocks={daySchedule}
            userName={roommate.name}
            userColor={roommate.color}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteTimeBlock}
          />
        </div>
      </main>

      {/* Quick Schedule Modal */}
      {isCurrentUser && (
        <QuickScheduleModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteTimeBlock}
          userName={roommate.name}
          userColor={roommate.color}
          initialDay={day}
          editMode={editMode}
          timeBlock={selectedTimeBlock}
        />
      )}
    </div>
  )
}
