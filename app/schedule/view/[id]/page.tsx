"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Edit2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useParams, useRouter } from "next/navigation"
import { QuickScheduleModal } from "@/components/quick-schedule-modal"

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

export default function ViewSchedule() {
  const params = useParams()
  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [roommate, setRoommate] = useState<{ id: string; name: string; color: string; initial: string } | null>(null)
  const [schedule, setSchedule] = useState<Record<string, Array<TimeBlock>> | null>(null)

  // Add a toggle state for the collapsed view at the top of the component
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Add a toggle state for time format (24h vs AM/PM)
  const [use24HourFormat, setUse24HourFormat] = useState(true)

  // State for quick schedule modal
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string>("Monday")
  const [editMode, setEditMode] = useState(false)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | undefined>(undefined)

  // Get current user name from localStorage
  const [currentUserName, setCurrentUserName] = useState("")

  // Track used colors
  const [usedColors, setUsedColors] = useState<string[]>([])

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const hours = Array.from({ length: 19 }, (_, i) => i + 6) // 6 to 24 (midnight) // 8 to 19

  // Add a state for tracking screen width
  const [screenWidth, setScreenWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const id = params.id as string
    const found = roommates.find((r) => r.id === id)

    if (!found) {
      router.push("/dashboard")
      return
    }

    // Check for saved color
    const savedColor = localStorage.getItem(`userColor_${found.name}`)
    if (savedColor) {
      found.color = savedColor
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

    // Load time format preference from localStorage
    const timeFormatPreference = localStorage.getItem("timeFormat")
    if (timeFormatPreference) {
      setUse24HourFormat(timeFormatPreference === "24h")
    }

    // Set used colors
    const colors = roommates.map((r) => {
      const savedRoommateColor = localStorage.getItem(`userColor_${r.name}`)
      return savedRoommateColor || r.color
    })
    setUsedColors(colors)

    // Function to update screen width
    const handleResize = () => {
      const width = window.innerWidth
      setScreenWidth(width)
      setIsMobile(width < 768)
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [params.id, router])

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

  // Add a toggle function after the nextWeek function
  const toggleView = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Add a toggle function for time format
  const toggleTimeFormat = () => {
    const newFormat = !use24HourFormat
    setUse24HourFormat(newFormat)
    localStorage.setItem("timeFormat", newFormat ? "24h" : "12h")
  }

  // Format hour based on selected format
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

  // Convert time string to position percentage
  const timeToPosition = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes
    const startMinutes = 6 * 60 // 6:00 AM
    const endMinutes = 24 * 60 // 12:00 AM (midnight)
    const totalDuration = endMinutes - startMinutes

    return ((totalMinutes - startMinutes) / totalDuration) * 100
  }

  // Handle opening the modal when clicking on a day header
  const handleDayClick = (day: string) => {
    // Only allow editing your own schedule
    if (roommate && roommate.name === currentUserName) {
      setSelectedDay(day)
      setEditMode(false)
      setSelectedTimeBlock(undefined)
      setModalOpen(true)
    }
  }

  // Handle opening the modal when clicking on the + button
  const handleAddClick = (day: string) => {
    if (roommate && roommate.name === currentUserName) {
      setSelectedDay(day)
      setEditMode(false)
      setSelectedTimeBlock(undefined)
      setModalOpen(true)
    }
  }

  // Handle opening the modal when clicking on a time block
  const handleTimeBlockClick = (day: string, timeBlock: TimeBlock) => {
    if (roommate && roommate.name === currentUserName) {
      setSelectedDay(day)
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

      // Sort the time blocks by start time after adding the new one
      newSchedule[day].push(timeBlock)
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
      localStorage
        .setItem(`schedule_${roommate.name}`, JSON.stringify(newSchedule))
        .setItem(`schedule_${roommate.name}`, JSON.stringify(newSchedule))
    }
  }

  // Handle changing user color
  const handleUserColorChange = (color: string) => {
    if (!roommate) return

    // Update roommate color
    const updatedRoommate = { ...roommate, color }
    setRoommate(updatedRoommate)

    // Save to localStorage
    localStorage.setItem(`userColor_${roommate.name}`, color)

    // Update used colors
    const newUsedColors = [...usedColors]
    const index = newUsedColors.findIndex((c) => c === roommate.color)
    if (index !== -1) {
      newUsedColors[index] = color
    }
    setUsedColors(newUsedColors)
  }

  if (!roommate || !schedule) {
    return <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">Loading...</div>
  }

  const isCurrentUser = roommate.name === currentUserName

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
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isCurrentUser ? "ring-2 ring-offset-2 ring-offset-[#121212] ring-[#444444]" : ""}`}
                style={{ backgroundColor: roommate.color, color: "#000" }}
              >
                {roommate.initial}
              </div>
              <h1 className="text-xl font-bold">
                {roommate.name}'s Schedule {isCurrentUser && "(You)"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={previousWeek} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous week</span>
            </Button>

            <span className="text-sm px-2">{formatWeekRange(currentWeek)}</span>

            <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next week</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTimeFormat}
              className="h-8 w-8 text-white hover:bg-[#333333]"
              title={use24HourFormat ? "Switch to AM/PM format" : "Switch to 24-hour format"}
            >
              <Clock className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleView}
              className="h-8 w-8 text-white hover:bg-[#333333]"
              title={isCollapsed ? "Show Detailed View" : "Show Collapsed View"}
            >
              {isCollapsed ? (
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
                  className="lucide lucide-layout-list"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                  <path d="M14 4h7" />
                  <path d="M14 9h7" />
                  <path d="M14 15h7" />
                  <path d="M14 20h7" />
                </svg>
              ) : (
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
                  className="lucide lucide-layout-grid"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {days.map((day) => (
          <div key={day} className="mb-6">
            {/* Day header - stays fixed at the top */}
            <div className="sticky top-[73px] z-50 bg-[#121212] pt-2 pb-1 flex items-center justify-between px-2">
              <Link
                href={`/schedule/day-view/${roommate.id}/${day.toLowerCase()}`}
                className={`text-sm font-medium ${isCurrentUser ? "hover:text-[#BB86FC]" : ""}`}
              >
                {day} {isCurrentUser && <span className="text-xs text-[#A0A0A0]">(view details)</span>}
              </Link>

              {/* Add button for current user */}
              {isCurrentUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-[#333333] hover:bg-[#444444]"
                  onClick={() => handleAddClick(day)}
                >
                  <Plus className="h-3 w-3" />
                  <span className="sr-only">Add schedule item</span>
                </Button>
              )}
            </div>

            {/* Scrollable container for mobile - contains both time header and content */}
            <div className="md:overflow-visible overflow-x-auto scrollbar-hide">
              <div className="min-w-[800px] md:min-w-0 pl-2">
                {/* Time header - now inside the scrollable container */}
                <div className="sticky top-[105px] z-40 bg-[#121212] pt-1 pb-10">
                  <div className="relative h-6">
                    <div className="absolute inset-0 flex">
                      {hours.map((hour) => (
                        <div key={hour} className="flex-1 relative">
                          {getVisibleHours().includes(hour) && (
                            <div
                              className="absolute top-0 text-[10px] text-[#666666] whitespace-nowrap"
                              style={{ left: `${((hour - 6) / 18) * 100}%` }}
                            >
                              {formatHour(hour)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Adjust the height based on collapsed state */}
                <div
                  className={`relative mt-8 pt-2 ${
                    isCollapsed ? "h-2" : "h-10"
                  } bg-[#1E1E1E] rounded-md overflow-hidden transition-all duration-200`}
                >
                  {/* Vertical grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {hours.map((hour) => (
                      <div key={hour} className="flex-1 border-l border-[#333333] first:border-l-0 h-full" />
                    ))}
                  </div>

                  {/* Schedule blocks */}
                  {schedule[day]?.map((block, index) => {
                    // For all-day events, span the entire width
                    const startPos = block.allDay ? 0 : timeToPosition(block.start)
                    const endPos = block.allDay ? 100 : timeToPosition(block.end)
                    const width = block.allDay ? 100 : endPos - startPos

                    return (
                      <div
                        key={block.id || index}
                        className={`absolute ${
                          isCollapsed ? "h-2" : "top-0 h-full"
                        } rounded-md flex items-center justify-center transition-all duration-200 z-10 ${
                          isCurrentUser ? "cursor-pointer hover:opacity-90" : ""
                        }`}
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                          backgroundColor: roommate.color,
                          color: "#000",
                          top: isCollapsed ? "0" : undefined,
                        }}
                        title={`${block.label}${block.allDay ? " (All Day)" : `: ${block.start} - ${block.end}`}`}
                        onClick={() => isCurrentUser && handleTimeBlockClick(day, block)}
                      >
                        {!isCollapsed && width > 15 ? (
                          <div className="flex items-center justify-center w-full">
                            <span className="text-xs font-medium truncate px-2">
                              {block.label}
                              {block.allDay ? " (All Day)" : ""}
                            </span>
                            {isCurrentUser && width > 30 && <Edit2 className="h-3 w-3 opacity-70" />}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
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
          initialDay={selectedDay}
          editMode={editMode}
          timeBlock={selectedTimeBlock}
          usedColors={usedColors}
          onUserColorChange={handleUserColorChange}
        />
      )}

      {/* Add CSS to hide scrollbars */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  )
}
