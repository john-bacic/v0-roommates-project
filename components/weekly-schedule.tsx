"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { QuickScheduleModal } from "@/components/quick-schedule-modal"
import { Plus, Edit2, Clock } from "lucide-react"

interface User {
  id: number
  name: string
  color: string
  initial: string
}

interface TimeBlock {
  id?: string
  start: string
  end: string
  label: string
  allDay?: boolean
}

interface WeeklyScheduleProps {
  users: User[]
  currentWeek: Date
  onColorChange?: (name: string, color: string) => void
}

// Sample schedule data - in a real app, this would be loaded from localStorage or a database
const sampleSchedules: Record<number, Record<string, Array<TimeBlock>>> = {
  1: {
    // Riko - Updated schedule
    Monday: [{ id: "r-mon-1", start: "16:00", end: "23:00", label: "Work" }],
    Tuesday: [{ id: "r-tue-1", start: "17:00", end: "22:00", label: "Work" }],
    Wednesday: [{ id: "r-wed-1", start: "12:00", end: "22:00", label: "Work" }],
    Thursday: [{ id: "r-thu-1", start: "12:00", end: "23:00", label: "Work" }],
    Friday: [{ id: "r-fri-1", start: "17:00", end: "23:30", label: "Work" }],
    Saturday: [{ id: "r-sat-1", start: "17:00", end: "23:30", label: "Work" }],
    Sunday: [{ id: "r-sun-1", start: "16:00", end: "22:00", label: "Work" }],
  },
  2: {
    // Narumi - Updated schedule
    Monday: [{ id: "n-mon-1", start: "10:00", end: "19:45", label: "Work" }],
    Tuesday: [{ id: "n-tue-1", start: "00:00", end: "23:59", label: "Day off", allDay: true }],
    Wednesday: [{ id: "n-wed-1", start: "00:00", end: "23:59", label: "Day off", allDay: true }],
    Thursday: [{ id: "n-thu-1", start: "10:00", end: "19:45", label: "Work" }],
    Friday: [{ id: "n-fri-1", start: "00:00", end: "23:59", label: "Day off", allDay: true }],
    Saturday: [{ id: "n-sat-1", start: "06:00", end: "18:45", label: "Work" }],
    Sunday: [{ id: "n-sun-1", start: "11:00", end: "19:45", label: "Work" }],
  },
  3: {
    // John - Updated schedule
    Monday: [{ id: "j-mon-1", start: "09:00", end: "17:00", label: "Work" }],
    Tuesday: [{ id: "j-tue-1", start: "09:00", end: "21:00", label: "Work" }],
    Wednesday: [{ id: "j-wed-1", start: "09:00", end: "17:00", label: "Work" }],
    Thursday: [{ id: "j-thu-1", start: "09:00", end: "17:00", label: "Work" }],
    Friday: [{ id: "j-fri-1", start: "00:00", end: "23:59", label: "Day off", allDay: true }],
    Saturday: [{ id: "j-sat-1", start: "00:00", end: "23:59", label: "Out of town", allDay: true }],
    Sunday: [{ id: "j-sun-1", start: "00:00", end: "23:59", label: "Out of town", allDay: true }],
  },
}

export function WeeklySchedule({ users: initialUsers, currentWeek, onColorChange }: WeeklyScheduleProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const hours = Array.from({ length: 21 }, (_, i) => i + 6) // 6 to 26 (2am)

  // For mobile view, we'll show a simplified version
  const [isMobile, setIsMobile] = useState(false)

  // Add a toggle state for the collapsed view, initialized from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('weeklyScheduleCollapsed')
      return savedState !== null ? savedState === 'true' : false
    }
    return false
  })

  // Add a toggle state for time format (24h vs AM/PM)
  const [use24HourFormat, setUse24HourFormat] = useState(true)

  // State for users (now mutable)
  const [users, setUsers] = useState<User[]>(initialUsers)

  // State for schedules
  const [schedules, setSchedules] = useState(sampleSchedules)

  // State for quick schedule modal
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>("Monday")
  const [editMode, setEditMode] = useState(false)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | undefined>(undefined)

  // Get current user name from localStorage
  const [currentUserName, setCurrentUserName] = useState("")

  // Track used colors
  const [usedColors, setUsedColors] = useState<string[]>([])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    // Get current user name
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setCurrentUserName(storedName)
    }

    // Load schedules from localStorage
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

    // Load time format preference from localStorage
    const timeFormatPreference = localStorage.getItem("timeFormat")
    if (timeFormatPreference) {
      setUse24HourFormat(timeFormatPreference === "24h")
    }

    // Load user colors from localStorage
    users.forEach((user) => {
      const savedColor = localStorage.getItem(`userColor_${user.name}`)
      if (savedColor) {
        updateUserColor(user, savedColor, false)
      }
    })

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Update users when initialUsers changes
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  // Update used colors whenever users change
  useEffect(() => {
    const colors = users.map((user) => user.color)
    setUsedColors(colors)
  }, [users])

  // Convert time string to position percentage
  const timeToPosition = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes
    const startMinutes = 6 * 60 // 6:00 AM
    const endMinutes = 26 * 60 // 2:00 AM
    const totalDuration = endMinutes - startMinutes

    return ((totalMinutes - startMinutes) / totalDuration) * 100
  }

  // Add a toggle function after the timeToPosition function
  const toggleView = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    // Save to localStorage
    localStorage.setItem('weeklyScheduleCollapsed', String(newState))
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
      if (hour === 24) return "00:00"
      if (hour === 25) return "01:00"
      if (hour === 26) return "02:00"
      return `${hour}:00`
    } else {
      if (hour === 0 || hour === 24) {
        return "12AM"
      }
      if (hour === 25) {
        return "1AM"
      }
      if (hour === 26) {
        return "2AM"
      }
      const period = hour >= 12 ? "PM" : "AM"
      const displayHour = hour > 12 ? hour - 12 : hour
      return `${displayHour}${period}`
    }
  }

  // Add a function to determine which hours to display based on screen width
  // Add this after the formatHour function
  const getVisibleHours = () => {
    if (isMobile) {
      // On very small screens, only show every 4 hours
      if (window.innerWidth < 400) {
        return hours.filter((hour) => hour % 4 === 6)
      }
      // On small screens, show every 3 hours
      else if (window.innerWidth < 600) {
        return hours.filter((hour) => hour % 3 === 0)
      }
      // On medium screens, show every 2 hours
      else {
        return hours.filter((hour) => hour % 2 === 0)
      }
    }
    // On desktop, show all hours
    return hours
  }

  // Handle opening the modal when clicking on a user
  const handleUserClick = (user: User, day: string) => {
    // Only allow editing your own schedule
    if (user.name === currentUserName) {
      setSelectedUser(user)
      setSelectedDay(day)
      setEditMode(false)
      setSelectedTimeBlock(undefined)
      setModalOpen(true)
    }
  }

  // Handle opening the modal when clicking on the + button
  const handleAddClick = (user: User, day: string) => {
    if (user.name === currentUserName) {
      setSelectedUser(user)
      setSelectedDay(day)
      setEditMode(false)
      setSelectedTimeBlock(undefined)
      setModalOpen(true)
    }
  }

  // Handle opening the modal when clicking on a time block
  const handleTimeBlockClick = (user: User, day: string, timeBlock: TimeBlock) => {
    if (user.name === currentUserName) {
      setSelectedUser(user)
      setSelectedDay(day)
      setEditMode(true)
      setSelectedTimeBlock(timeBlock)
      setModalOpen(true)
    }
  }

  // Handle saving the schedule from the modal
  const handleSaveSchedule = (day: string, timeBlock: TimeBlock) => {
    if (!selectedUser) return

    const userId = selectedUser.id
    const newSchedules = { ...schedules }

    // Make sure the day exists in the user's schedule
    if (!newSchedules[userId][day]) {
      newSchedules[userId][day] = []
    }

    if (editMode && selectedTimeBlock?.id) {
      // Update existing time block
      const index = newSchedules[userId][day].findIndex((block) => block.id === selectedTimeBlock.id)
      if (index !== -1) {
        newSchedules[userId][day][index] = { ...timeBlock }
      }
    } else {
      // Add the new time block with a unique ID if it doesn't have one
      if (!timeBlock.id) {
        timeBlock.id = crypto.randomUUID()
      }

      // Sort the time blocks by start time after adding the new one
      newSchedules[userId][day].push(timeBlock)
      newSchedules[userId][day].sort((a, b) => {
        const aTime = a.start.split(":").map(Number)
        const bTime = b.start.split(":").map(Number)
        return aTime[0] * 60 + aTime[1] - (bTime[0] * 60 + bTime[1])
      })
    }

    // Update state
    setSchedules(newSchedules)

    // Save to localStorage
    localStorage.setItem(`schedule_${selectedUser.name}`, JSON.stringify(newSchedules[userId]))
  }

  // Handle deleting a time block
  const handleDeleteTimeBlock = (day: string, timeBlockId: string) => {
    if (!selectedUser) return

    const userId = selectedUser.id
    const newSchedules = { ...schedules }

    // Filter out the time block with the matching ID
    if (newSchedules[userId][day]) {
      if (timeBlockId === "current" && selectedTimeBlock) {
        // If we're deleting the currently selected time block without an ID
        newSchedules[userId][day] = newSchedules[userId][day].filter((block) => block !== selectedTimeBlock)
      } else {
        // Normal case - filter by ID
        newSchedules[userId][day] = newSchedules[userId][day].filter((block) => block.id !== timeBlockId)
      }

      // Update state
      setSchedules(newSchedules)

      // Save to localStorage
      localStorage.setItem(`schedule_${selectedUser.name}`, JSON.stringify(newSchedules[userId]))
    }
  }

  // Handle changing a user's color
  const updateUserColor = (user: User, color: string, saveToStorage = true) => {
    // Update the user's color in the users array
    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return { ...u, color }
      }
      return u
    })
    setUsers(updatedUsers)

    // Save to localStorage if needed
    if (saveToStorage) {
      localStorage.setItem(`userColor_${user.name}`, color)

      // Notify parent component about the color change immediately
      if (onColorChange) {
        onColorChange(user.name, color)
      }

      // Create a custom event to notify other components about the color change
      const event = new CustomEvent("userColorChange", {
        detail: { userName: user.name, color },
      })
      window.dispatchEvent(event)
    }
  }

  return (
    <div className="w-full">
      {/* Make the Weekly Schedule header sticky with no bottom padding */}
      <div className="sticky top-[57px] z-40 bg-[#121212] border-t border-[#333333]">
        <div className="flex justify-between items-center h-[36px] px-2">
          <div>
            <h3 className="text-sm font-medium">Week of Apr 13 - Apr 19 Schedule</h3>
          </div>
          <div className="flex items-center gap-2">
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
      </div>

      {days.map((day) => (
        <div key={day} className="mb-8">
          {/* Day header - stays sticky */}
          <div className="sticky top-[93px] z-30 bg-[#121212]">
            <h4 className="text-sm font-medium pl-2 h-[36px] flex items-center">{day}</h4>
          </div>

          {/* Scrollable container for both time header and user content */}
          <div className="md:overflow-visible overflow-x-auto scrollbar-hide">
            <div className="min-w-[800px] md:min-w-0 pl-2">
              {/* Time header - now scrolls with content */}
              <div className="bg-[#121212] mb-6">
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

              {/* User schedules */}
              {users.map((user) => {
                const userSchedule = schedules[user.id][day] || []
                const isCurrentUser = user.name === currentUserName

                return (
                  <div key={`${day}-${user.id}`} className={`mb-${isCollapsed ? "1" : "4"} relative z-10`}>
                    <div className="flex items-center justify-between mb-1 pl-1">
                      <div
                        className={`flex items-center gap-2 ${isCurrentUser ? "cursor-pointer hover:opacity-80" : ""}`}
                        onClick={() => isCurrentUser && handleUserClick(user, day)}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isCurrentUser ? "ring-2 ring-offset-2 ring-offset-[#121212] ring-[#444444]" : ""
                          }`}
                          style={{ backgroundColor: user.color, color: "#000" }}
                        >
                          {user.initial}
                        </div>
                        <span className="text-sm">
                          {user.name}
                          {isCurrentUser && " (You)"}
                        </span>
                      </div>

                      {/* Add button for current user */}
                      {isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-[#333333] hover:bg-[#444444]"
                          onClick={() => handleAddClick(user, day)}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Add schedule item</span>
                        </Button>
                      )}
                    </div>

                    {/* Adjust the height based on collapsed state */}
                    <div
                      className={`relative ${
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
                      {userSchedule.map((block, index) => {
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
                              backgroundColor: user.color,
                              color: "#000",
                              top: isCollapsed ? "0" : undefined,
                            }}
                            title={`${block.label}${block.allDay ? " (All Day)" : `: ${block.start} - ${block.end}`}`}
                            onClick={() => isCurrentUser && handleTimeBlockClick(user, day, block)}
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
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Quick Schedule Modal */}
      {selectedUser && (
        <QuickScheduleModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteTimeBlock}
          userName={selectedUser.name}
          userColor={selectedUser.color}
          initialDay={selectedDay}
          editMode={editMode}
          timeBlock={selectedTimeBlock}
          usedColors={usedColors}
          onUserColorChange={(color) => {
            if (selectedUser) {
              updateUserColor(selectedUser, color)
            }
          }}
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
