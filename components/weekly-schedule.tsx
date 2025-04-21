"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { QuickScheduleModal } from "@/components/quick-schedule-modal"
import { Plus, Edit2, Clock, ChevronUp, ChevronDown } from "lucide-react"
import { getSupabase } from "@/lib/supabase"

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
  schedules?: Record<number, Record<string, Array<TimeBlock>>>
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

export function WeeklySchedule({ users: initialUsers, currentWeek, onColorChange, schedules: initialSchedules }: WeeklyScheduleProps) {
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
  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem('use24HourFormat')
      return savedFormat !== null ? savedFormat === 'true' : false
    }
    return false
  })

  // State for users (now mutable)
  const [users, setUsers] = useState<User[]>(initialUsers)

  // State for schedules - use provided schedules or fall back to sample data
  const [schedules, setSchedules] = useState(initialSchedules || sampleSchedules)

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

  // Set up real-time subscriptions for schedule and user changes
  useEffect(() => {
    // Set up subscription for schedule changes
    const scheduleSubscription = getSupabase()
      .channel('schedules-changes-weekly')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, (payload) => {
        // Get the updated schedule data directly from Supabase
        // This ensures we have the latest data without a full reload
        const fetchLatestData = async () => {
          try {
            // Get the user_id from the payload
            const userId = payload.new?.user_id || payload.old?.user_id;
            if (userId) {
              // Fetch all schedules for this user
              const { data: schedulesData, error } = await getSupabase()
                .from('schedules')
                .select('*')
                .eq('user_id', userId);
              
              if (!error && schedulesData) {
                // Transform the data into the format expected by the component
                const formattedSchedules: Record<string, Array<any>> = {};
                
                schedulesData.forEach(schedule => {
                  if (!formattedSchedules[schedule.day]) {
                    formattedSchedules[schedule.day] = [];
                  }
                  
                  formattedSchedules[schedule.day].push({
                    id: schedule.id,
                    start: schedule.start_time,
                    end: schedule.end_time,
                    label: schedule.label,
                    allDay: schedule.all_day
                  });
                });
                
                // Update only the affected user's schedule
                setSchedules(prev => ({
                  ...prev,
                  [userId]: formattedSchedules
                }));
              }
            }
          } catch (error) {
            console.error('Error fetching updated schedule data:', error);
          }
        };
        
        fetchLatestData();
      })
      .subscribe();

    // Set up subscription for user changes
    const usersSubscription = getSupabase()
      .channel('users-changes-weekly')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        // Update the user data when it changes
        if (payload.new) {
          const updatedUser = payload.new;
          setUsers(prev => prev.map(user => 
            user.id === updatedUser.id ? { ...user, ...updatedUser } : user
          ));
        }
      })
      .subscribe();

    return () => {
      getSupabase().removeChannel(scheduleSubscription);
      getSupabase().removeChannel(usersSubscription);
    };
  }, []);

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

    // Time format is now loaded in the useState initialization

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
    localStorage.setItem('use24HourFormat', newFormat.toString())
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
      // Ensure the timeBlock has a valid UUID if it doesn't already
      if (!timeBlock.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(timeBlock.id)) {
        console.warn('Time block has invalid UUID, generating a new one for UI purposes');
        timeBlock = { ...timeBlock, id: crypto.randomUUID() };
      }
      
      setSelectedUser(user)
      setSelectedDay(day)
      setSelectedTimeBlock(timeBlock)
      setEditMode(true)
      setModalOpen(true)
    }
  }

  // Handle saving the schedule from the modal
  const handleSaveSchedule = async (day: string, timeBlock: TimeBlock) => {
    if (!selectedUser) return

    const userId = selectedUser.id
    const newSchedules = { ...schedules }

    // Initialize user's schedule for the day if it doesn't exist
    if (!newSchedules[userId]) {
      newSchedules[userId] = {}
    }

    if (!newSchedules[userId][day]) {
      newSchedules[userId][day] = []
    }

    try {
      // If editing, replace the existing time block
      if (editMode && selectedTimeBlock?.id) {
        // Update the time block in Supabase
        const { error: updateError } = await getSupabase()
          .from('schedules')
          .update({
            start_time: timeBlock.start,
            end_time: timeBlock.end,
            label: timeBlock.label,
            all_day: timeBlock.allDay || false
          })
          .eq('id', selectedTimeBlock.id);

        if (updateError) {
          console.error('Error updating schedule in Supabase:', updateError);
        }

        // Update local state
        newSchedules[userId][day] = newSchedules[userId][day].map((block) =>
          block.id === selectedTimeBlock.id ? { ...timeBlock, id: selectedTimeBlock.id } : block
        )
      } else {
        // Create a new time block in Supabase - let Supabase generate the UUID
        const { data: insertedData, error: insertError } = await getSupabase()
          .from('schedules')
          .insert({
            user_id: userId,
            day: day,
            start_time: timeBlock.start,
            end_time: timeBlock.end,
            label: timeBlock.label,
            all_day: timeBlock.allDay || false
          })
          .select(); // Return the inserted row with the generated UUID

        if (insertError) {
          console.error('Error inserting schedule in Supabase:', insertError);
          // Still update local state with a temporary ID for UI purposes
          const tempId = crypto.randomUUID();
          newSchedules[userId][day].push({ ...timeBlock, id: tempId });
        } else if (insertedData && insertedData.length > 0) {
          // Update local state with the proper UUID from Supabase
          const newId = insertedData[0].id;
          newSchedules[userId][day].push({
            ...timeBlock,
            id: newId,
            start: insertedData[0].start_time,
            end: insertedData[0].end_time,
            label: insertedData[0].label,
            allDay: insertedData[0].all_day
          });
        }
      }

      // Update local state
      setSchedules(newSchedules)

      // Save to localStorage as a fallback
      localStorage.setItem('roommate-schedules', JSON.stringify(newSchedules))
    } catch (error) {
      console.error('Error saving schedule:', error);
    }

    // Close the modal
    setModalOpen(false)
  }

  // Handle deleting a time block
  // Format week range with month names (similar to Overview component)
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

  const handleDeleteTimeBlock = async (day: string, timeBlockId: string) => {
    if (!selectedUser) return

    const userId = selectedUser.id
    const newSchedules = { ...schedules }

    try {
      // Check if the timeBlockId is a valid UUID before trying to delete from Supabase
      // UUID format validation using a simple regex
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(timeBlockId);
      
      if (isValidUUID) {
        // Delete the time block from Supabase
        const { error: deleteError } = await getSupabase()
          .from('schedules')
          .delete()
          .eq('id', timeBlockId);

        if (deleteError) {
          console.error('Error deleting schedule from Supabase:', deleteError);
        }
      } else {
        console.warn('Skipping Supabase delete - not a valid UUID:', timeBlockId);
      }

      // Check if the user and day exist in the schedules
      if (newSchedules[userId] && newSchedules[userId][day]) {
        // Filter out the time block with the matching ID
        newSchedules[userId][day] = newSchedules[userId][day].filter((block) => block.id !== timeBlockId)

        // Update local state
        setSchedules(newSchedules)

        // Save to localStorage as a fallback
        localStorage.setItem('roommate-schedules', JSON.stringify(newSchedules))
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }

    // Close the modal
    setModalOpen(false)
  }

  // Handle changing a user's color
  const updateUserColor = async (user: User, color: string, saveToStorage = true) => {
    // Update the user's color in the local state WITHOUT affecting schedules
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, color } : u)))

    // Notify the parent component of the color change
    if (onColorChange) {
      onColorChange(user.name, color)
    }

    // Save the color to Supabase
    try {
      const { error } = await getSupabase()
        .from('users')
        .update({ color })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating user color in Supabase:', error);
      }
    } catch (error) {
      console.error('Error updating user color:', error);
    }

    // Save the color to localStorage as a fallback
    if (saveToStorage) {
      localStorage.setItem(`userColor_${user.name}`, color)
      const event = new CustomEvent("userColorChange", {
        detail: { userName: user.name, color },
      })
      window.dispatchEvent(event)
    }

    // Don't close the modal when changing colors
    // This allows users to try multiple colors before closing
  }

  return (
    <div className="w-full">
      {/* Make the Weekly Schedule header sticky with no bottom padding */}
      <div className="sticky top-[57px] z-40 bg-[#121212] border-t border-[#333333]">
        <div className="flex justify-between items-center h-[36px] px-2">
          <div>
            <h3 className="text-sm font-medium">Week of {formatWeekRange(currentWeek)} Schedule</h3>
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
              title={isCollapsed ? "expand-all" : "collapse-all"}
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
                >
                  {/* Chevron down */}
                  <polyline points="6 9 12 15 18 9" />
                  {/* Horizontal line below the chevron with more space */}
                  <line x1="4" y1="19" x2="20" y2="19" />
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
                >
                  {/* Horizontal line above the chevron with more space */}
                  <line x1="4" y1="5" x2="20" y2="5" />
                  {/* Chevron up */}
                  <polyline points="18 15 12 9 6 15" />
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
