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
  useAlternatingBg?: boolean
}

// Helper function to get text color based on background color for contrast
const getTextColor = (bgColor: string): string => {
  // Convert hex to RGB
  const hex = bgColor.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

export function MultiDayView({ users: initialUsers, schedules: initialSchedules, days, useAlternatingBg = false }: MultiDayViewProps) {
  // Initialize isCollapsed state from localStorage or default to true
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('multiDayViewCollapsed')
      return savedState !== null ? savedState === 'true' : true
    }
    return true
  })

  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem('use24HourFormat')
      return savedFormat !== null ? savedFormat === 'true' : false
    }
    return false
  })

  const [users, setUsers] = useState<User[]>(initialUsers)
  const [schedules, setSchedules] = useState(initialSchedules)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User>(users[0])
  const [selectedDay, setSelectedDay] = useState<string>(days[0])
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | undefined>()
  const [editMode, setEditMode] = useState(false)
  const [usedColors, setUsedColors] = useState<string[]>([])
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [screenWidth, setScreenWidth] = useState(0)

  // Calculate hours to display from 5am to 2am (next day) to match other views
  const hours = Array.from({ length: 21 }, (_, i) => (i + 5) % 24)

  // Format hour display based on user preference
  const formatHour = (hour: number): string => {
    if (use24HourFormat) {
      return `${hour.toString().padStart(2, '0')}:00`
    } else {
      const period = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour % 12 || 12
      return `${displayHour}${period}`
    }
  }

  useEffect(() => {
    // Get current user name
    const storedUserName = localStorage.getItem('currentUserName')
    if (storedUserName) {
      setCurrentUserName(storedUserName)
    }

    // Update schedules when props change
    setUsers(initialUsers)
    setSchedules(initialSchedules)

    // Update screen width
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }
    
    // Set initial screen width
    setScreenWidth(window.innerWidth)
    
    // Add event listener for resize
    window.addEventListener("resize", handleResize)
    
    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [initialUsers, initialSchedules])

  // Update used colors whenever users change
  useEffect(() => {
    const colors = users.map((user) => user.color)
    setUsedColors(colors)
  }, [users])

  const toggleView = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('multiDayViewCollapsed', newState.toString())
  }

  const toggleTimeFormat = () => {
    const newFormat = !use24HourFormat
    setUse24HourFormat(newFormat)
    localStorage.setItem('use24HourFormat', newFormat.toString())
  }

  // Handle opening the modal for adding a new schedule
  const handleAddClick = (user: User, day: string) => {
    setSelectedUser(user)
    setSelectedDay(day)
    setEditMode(false)
    setSelectedTimeBlock(undefined)
    
    // Open the modal
    setModalOpen(true)
  }

  // Handle clicking on an existing schedule block to edit
  const handleBlockClick = (user: User, day: string, block: TimeBlock) => {
    setSelectedUser(user)
    setSelectedDay(day)
    setEditMode(true)
    setSelectedTimeBlock(block)
    
    // Open the modal
    setModalOpen(true)
  }

  // Handle saving a schedule
  const handleSaveSchedule = (day: string, timeBlock: TimeBlock) => {
    // This will be handled by the parent component via props
  }

  // Handle deleting a schedule
  const handleDeleteTimeBlock = () => {
    // This will be handled by the parent component via props
  }

  // Calculate the percentage position for a time value
  const calculateTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    const startMinutes = 5 * 60 // 5am
    const totalDuration = 24 * 60 // 24 hours
    
    return ((totalMinutes - startMinutes) / totalDuration) * 100
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 px-4">
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
        </div>
      </div>

      {/* Day headers */}
      <div className="flex">
        {/* Empty cell for time column - narrower on mobile */}
        <div className="w-12 min-w-12 sm:w-16 sm:min-w-16"></div>
        <div className="flex-grow flex">
          {/* Day columns */}
          {days.map((day, dayIndex) => (
            <div 
              key={day} 
              className={`flex-1 py-2 text-center font-medium ${useAlternatingBg && dayIndex % 2 === 1 ? 'bg-[#1A1A1A]' : ''}`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="inline sm:hidden">{day.substring(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time slots and events */}
      <div className="relative">
        {hours.map((hour) => (
          <div key={hour} className="flex">
            {/* Time label - positioned to align with the horizontal grid line */}
            <div className="w-12 min-w-12 sm:w-16 sm:min-w-16 relative bg-[#282828]">
              <span className="text-xs text-[#666666] absolute right-2 -top-3 z-10">
                {formatHour(hour)}
              </span>
            </div>
            <div className="flex-grow flex">
              {/* Day columns */}
              {days.map((day, dayIndex) => (
                <div key={`${day}-${hour}`} className={`flex-1 relative h-12 ${useAlternatingBg && dayIndex % 2 === 1 ? 'bg-[#1A1A1A]' : ''}`}>
                  {/* Line segments for this day/hour */}
                  {users.map((user) => {
                    const userBlocks = schedules[user.id]?.[day] || [];
                    
                    return userBlocks.map((block) => {
                      // Special handling for all-day events
                      if (block.allDay) {
                        // Calculate the relative position within the day column
                        const userIndex = users.findIndex(u => u.id === user.id);
                        const totalUsers = users.length;
                        const leftPosition = ((userIndex + 0.5) / totalUsers) * 100;
                        
                        // For the first hour, render the user initial at the top
                        if (hour === hours[0]) {
                          return (
                            <div key={`all-day-${block.id || `${day}-${user.id}`}`}>
                              {/* Full-height all-day line */}
                              <div 
                                className="absolute cursor-pointer"
                                style={{
                                  top: "0",
                                  height: "100%", // Full height of the hour cell
                                  left: `${leftPosition}%`,
                                  width: "4px", // Thinner line for all-day events
                                  transform: "translateX(-50%)",
                                  backgroundColor: user.color,
                                  opacity: 0.5,
                                  zIndex: 10,
                                }}
                                onClick={() => handleBlockClick(user, day, block)}
                                title={`${user.name}: ${block.label} (All Day)`}
                              />
                              {/* User initial and time label */}
                              <div 
                                className="absolute rounded-full flex items-center justify-center w-6 h-6 text-xs font-bold z-20"
                                style={{
                                  top: "10px", // Position below the days row
                                  left: `${leftPosition}%`,
                                  transform: "translate(-50%, 0)",
                                  backgroundColor: user.color,
                                  color: getTextColor(user.color),
                                }}
                              >
                                {user.initial}
                              </div>
                            </div>
                          );
                        }
                        
                        // For all other hours, just render the line without the initial
                        return (
                          <div key={`all-day-${block.id || `${day}-${user.id}-${hour}`}`}>
                            <div 
                              className="absolute cursor-pointer"
                              style={{
                                top: "0",
                                height: "100%", // Full height of the hour cell
                                left: `${leftPosition}%`,
                                width: "4px", // Thinner line for all-day events
                                transform: "translateX(-50%)",
                                backgroundColor: user.color,
                                opacity: 0.5,
                                zIndex: 10,
                              }}
                              onClick={() => handleBlockClick(user, day, block)}
                              title={`${user.name}: ${block.label} (All Day)`}
                            />
                          </div>
                        );
                      } 
                      
                      // Skip if the block doesn't overlap with this hour
                      const [startHour, startMinute] = block.start.split(':').map(Number);
                      const [endHour, endMinute] = block.end.split(':').map(Number);
                      
                      // Check if this time block overlaps with the current hour
                      const blockStartHour = startHour;
                      const blockEndHour = endHour;
                      
                      // Skip if the block doesn't overlap with this hour
                      if (blockStartHour > hour || blockEndHour < hour) {
                        return null;
                      }
                      
                      // Calculate the user's position (left offset) within the day column
                      // We'll distribute users evenly across the column
                      const userIndex = users.findIndex(u => u.id === user.id);
                      const totalUsers = users.length;
                      const leftPosition = ((userIndex + 0.5) / totalUsers) * 100;
                      
                      // Check if this is the first hour of the block
                      const isFirstHour = blockStartHour === hour;
                      
                      // Ensure precise alignment with the time row
                      let topPosition = 0;
                      if (startHour === hour) {
                        topPosition = (startMinute / 60) * 100;
                      }
                      
                      // For the last hour, we'll adjust the height based on the minutes
                      // Ensure precise alignment with the time row
                      let heightPercent = 100;
                      if (endHour === hour) {
                        heightPercent = (endMinute / 60) * 100;
                      } else if (startHour === hour) {
                        // If it's the start hour, adjust height accounting for start minutes
                        heightPercent = 100 - (startMinute / 60) * 100;
                      }
                      
                      return (
                        <div key={`line-${block.id || `${day}-${user.id}-${hour}-${block.start}`}`}>
                          {/* Vertical line segment */}
                          <div 
                            className="absolute cursor-pointer"
                            style={{
                              top: `${topPosition}%`,
                              height: `${heightPercent}%`,
                              left: `${leftPosition}%`,
                              width: "10px",
                              transform: "translateX(-50%)",
                              backgroundColor: user.color,
                              opacity: block.allDay ? 0.5 : 1,
                              zIndex: 10,
                            }}
                            onClick={() => handleBlockClick(user, day, block)}
                            title={`${user.name}: ${block.label} (${block.start} - ${block.end})`}
                          />
                          
                          {/* User initial and time information - only on the first hour */}
                          {isFirstHour && (
                            <>
                              <div 
                                className="absolute rounded-full flex items-center justify-center w-6 h-6 text-xs font-bold z-20"
                                style={{
                                  top: "0", // Always at the top of the timeline
                                  left: `${leftPosition}%`,
                                  transform: "translate(-50%, 0)", // Changed from -50% to 0 for Y-axis
                                  backgroundColor: user.color,
                                  color: getTextColor(user.color),
                                }}
                              >
                                {user.initial}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    });
                  })}
                  
                  {/* Add button */}
                  <div 
                    className="absolute bottom-0 right-0 cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                    onClick={() => handleAddClick(users.find(u => u.name === currentUserName) || users[0], day)}
                  >
                    <Plus className="h-3 w-3 text-[#666666]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Schedule Modal */}
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
        onUserColorChange={(color: string) => {
          if (selectedUser) {
            // Update the user's color
          }
        }}
      />
    </div>
  );
}
