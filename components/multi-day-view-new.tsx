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
  // Initialize isCollapsed state from localStorage or default to true
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('multiDayViewCollapsed')
      return savedState !== null ? savedState === 'true' : true
    }
    return true
  })
  
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
  const [showColorPicker, setShowColorPicker] = useState(false)

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
    const newState = !isCollapsed
    setIsCollapsed(newState)
    // Save to localStorage
    localStorage.setItem('multiDayViewCollapsed', String(newState))
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

  // Helper function to get text color based on background color for contrast
  const getTextColor = (bgColor: string): string => {
    // Convert hex to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate luminance - standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

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

      {/* Vertical calendar layout */}
      <div className="relative">
        {/* Day headers across the top */}
        <div className="sticky top-[57px] z-40 bg-[#333333] flex border-b border-[#333333]">
          {/* Empty cell for time column */}
          <div className="w-16 min-w-16 border-r border-[#333333] py-2"></div>
          
          {/* Day headers */}
          {days.map((day) => (
            <div key={day} className="flex-1 text-center py-2 px-1">
              <h4 className="text-sm font-medium">{day}</h4>
            </div>
          ))}
        </div>

        {/* Time slots and events */}
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="flex border-b border-[#333333]">
              {/* Time label */}
              <div className="w-16 min-w-16 border-r border-[#333333] py-2 text-right pr-2">
                <span className="text-xs text-[#666666]">{formatHour(hour)}</span>
              </div>
              
              {/* Day columns */}
              {days.map((day) => (
                <div key={`${day}-${hour}`} className="flex-1 relative h-12 border-r border-[#333333] border-opacity-30">
                  {/* Render events that fall within this hour for this day */}
                  {users.map((user) => {
                    const userSchedule = schedules[user.id]?.[day] || []
                    const isCurrentUser = user.name === currentUserName
                    
                    // Filter blocks that overlap with this hour
                    return userSchedule
                      .filter((block) => {
                        const startParts = block.start.split(":").map(Number)
                        const endParts = block.end.split(":").map(Number)
                        const startHour = startParts[0] + startParts[1] / 60
                        const endHour = endParts[0] + endParts[1] / 60
                        
                        return (startHour <= hour + 1 && endHour >= hour);
                      })
                      .map((block) => {
                        const startParts = block.start.split(":").map(Number)
                        const endParts = block.end.split(":").map(Number)
                        const startHour = startParts[0] + startParts[1] / 60
                        const endHour = endParts[0] + endParts[1] / 60
                        
                        // Calculate position and height
                        const startPercent = Math.max(0, (startHour - hour) * 100)
                        const endPercent = Math.min(100, (endHour - hour) * 100)
                        const heightPercent = endPercent - startPercent
                        
                        return (
                          <div
                            key={block.id || `${day}-${user.id}-${hour}-${block.start}`}
                            className={`absolute rounded ${isCurrentUser ? "cursor-pointer" : ""}`}
                            style={{
                              top: `${startPercent}%`,
                              height: `${heightPercent}%`,
                              left: '2px',
                              right: '2px',
                              backgroundColor: user.color,
                              opacity: 0.8,
                              zIndex: 10
                            }}
                            onClick={() => isCurrentUser && handleTimeBlockClick(user, day, block)}
                          >
                            <div
                              className="text-xs font-medium truncate px-1 h-full flex items-center"
                              style={{ color: getTextColor(user.color) }}
                            >
                              <div className="flex items-center gap-1 overflow-hidden">
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px]"
                                  style={{
                                    backgroundColor: user.color,
                                    color: getTextColor(user.color),
                                    border: '1px solid ' + getTextColor(user.color)
                                  }}
                                >
                                  {user.initial}
                                </div>
                                {heightPercent > 30 && (
                                  <span className="truncate">{block.label}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                  })}
                  
                  {/* Add button for current user */}
                  {currentUserName && (
                    <div 
                      className="absolute top-0 right-0 opacity-0 hover:opacity-100 p-1 z-20"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 bg-[#333333] text-white hover:bg-[#444444] rounded-full"
                        onClick={() => {
                          const user = users.find(u => u.name === currentUserName);
                          if (user) handleAddClick(user, day);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Schedule Modal */}
      {selectedUser && (
        <QuickScheduleModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteTimeBlock}
          user={selectedUser}
          day={selectedDay}
          editMode={editMode}
          timeBlock={selectedTimeBlock}
          usedColors={usedColors}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          onUserColorChange={updateUserColor}
        />
      )}
    </div>
  )
}
