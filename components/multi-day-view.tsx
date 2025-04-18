"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { QuickScheduleModal } from "@/components/quick-schedule-modal"
import { Plus, Edit2, Clock } from "lucide-react"

interface User {
  id: number
  name: string
  color: string
  initial: string
}

// Update the TimeBlock interface
interface TimeBlock {
  id?: string
  start: string
  end: string
  label: string
  allDay?: boolean
}

interface MultiDayViewProps {
  users: User[]
  schedules: Record<number, Record<string, Array<TimeBlock>>>
  days: string[]
}

export function MultiDayView({ users: initialUsers, schedules: initialSchedules, days }: MultiDayViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  // Change the hours array to start at 6am and end at midnight
  const hours = Array.from({ length: 19 }, (_, i) => i + 6) // 6 to 24 (midnight)

  // Add a toggle state for time format (24h vs AM/PM)
  const [use24HourFormat, setUse24HourFormat] = useState(true)

  // State for users (now mutable)
  const [users, setUsers] = useState<User[]>(initialUsers)

  // State for schedules
  const [schedules, setSchedules] = useState(initialSchedules)

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

  // Add a state for tracking screen width
  const [screenWidth, setScreenWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Get current user name
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setCurrentUserName(storedName)
    }

    // Load schedules from localStorage
    const loadedSchedules = { ...initialSchedules }
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
  }, [])

  // Update used colors whenever users change
  useEffect(() => {
    const colors = users.map((user) => user.color)
    setUsedColors(colors)
  }, [users])

  const toggleView = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Add a toggle function for time format
  const toggleTimeFormat = () => {
    const newFormat = !use24HourFormat
    setUse24HourFormat(newFormat)
    localStorage.setItem("timeFormat", newFormat ? "24h" : "12h")
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
  // Update the timeToPosition function to use the new time range
  const timeToPosition = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes
    const startMinutes = 6 * 60 // 6:00 AM
    const endMinutes = 24 * 60 // 12:00 AM (midnight)
    const totalDuration = endMinutes - startMinutes

    return ((totalMinutes - startMinutes) / totalDuration) * 100
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
        newSchedules[userId][day][index] = timeBlock
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
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">All Schedules</h3>
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

      <div className="space-y-6">
        {days.map((day) => (
          <div key={day} className="mb-4">
            {/* Day header - stays fixed at the top */}
            <div className="sticky top-0 z-50 bg-[#1E1E1E] pt-2 pb-1">
              <h4 className="text-sm font-medium mb-2 pl-2">{day}</h4>
            </div>

            {/* Scrollable container for the entire day group */}
            <div className="md:overflow-visible overflow-x-auto scrollbar-hide">
              <div className="min-w-[800px] md:min-w-0 pl-2">
                {/* Time header - now inside the scrollable container */}
                <div className="sticky top-8 z-40 bg-[#1E1E1E] pt-1 pb-10">
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
                <div className="space-y-3">
                  {users.map((user) => {
                    const userSchedule = schedules[user.id]?.[day] || []
                    const isCurrentUser = user.name === currentUserName

                    return (
                      <div
                        key={`${day}-${user.id}`}
                        className={`mb-${isCollapsed ? "1" : "2"} mt-8 pt-2 relative z-30`}
                      >
                        <div className="flex items-center justify-between mb-1 pl-1">
                          <div
                            className={`flex items-center gap-2 ${isCurrentUser ? "cursor-pointer hover:opacity-80" : ""}`}
                            onClick={() => isCurrentUser && handleUserClick(user, day)}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isCurrentUser ? "ring-2 ring-offset-2 ring-offset-[#1E1E1E] ring-[#444444]" : ""}`}
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
                          className={`relative ${isCollapsed ? "h-2" : "h-8"} bg-[#1E1E1E] rounded-md overflow-hidden transition-all duration-200`}
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
          </div>
        ))}
      </div>

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
