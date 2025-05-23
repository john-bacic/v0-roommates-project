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
  useAlternatingBg?: boolean
  onTimeFormatChange?: (use24Hour: boolean) => void
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

export function WeeklySchedule({ users: initialUsers, currentWeek, onColorChange, schedules: initialSchedules, useAlternatingBg = false, onTimeFormatChange }: WeeklyScheduleProps) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const hours = Array.from({ length: 25 }, (_, i) => i + 6) // 6am to 6am next day (includes hours 0-6)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Helper function to always return dark text for colored backgrounds
  const getTextColor = (bgColor: string) => {
    return "#000" // Always use dark text against colored backgrounds
  }

  // For mobile view, we'll show a simplified version
  const [isMobile, setIsMobile] = useState(false)
  
  // State for header visibility based on scroll
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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
  const [isColorPickerOnly, setIsColorPickerOnly] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>("Monday")
  const [editMode, setEditMode] = useState(false)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | undefined>(undefined)

  // Get current user name from localStorage
  const [currentUserName, setCurrentUserName] = useState("")

  // Track used colors
  const [usedColors, setUsedColors] = useState<string[]>([])

  // Set up a timer to update current time every minute
  useEffect(() => {
    // Update current time immediately
    setCurrentTime(new Date())
    
    // Set up interval to update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      // Force re-render by updating state
      setForceUpdate(prev => prev + 1)
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])
  
  // Add a force update state to ensure the component re-renders
  const [forceUpdate, setForceUpdate] = useState(0)

  // Set up real-time subscriptions for schedule and user changes
  useEffect(() => {
    // Set up subscription for schedule changes
    const scheduleSubscription = getSupabase()
      .channel('schedules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, (payload) => {
        // Get the updated schedule data directly from Supabase
        // This ensures we have the latest data without a full reload
        const fetchLatestData = async () => {
          try {
            // Get the user_id from the payload with proper type checking
            const newData = payload.new as Record<string, any> | null;
            const oldData = payload.old as Record<string, any> | null;
            const userId = newData?.user_id || oldData?.user_id;
            
            if (userId) {
              // Fetch all schedules for this user
              const { data: schedulesData, error } = await getSupabase()
                .from('schedules')
                .select('*')
                .eq('user_id', userId);
              
              if (!error && schedulesData) {
                // Transform the data into the format expected by the component
                const formattedSchedules: Record<string, Array<TimeBlock>> = {};
                
                schedulesData.forEach(schedule => {
                  // Ensure schedule is typed correctly
                  const typedSchedule = schedule as Record<string, any>;
                  const day = typedSchedule.day as string;
                  
                  if (!formattedSchedules[day]) {
                    formattedSchedules[day] = [];
                  }
                  
                  formattedSchedules[day].push({
                    id: typedSchedule.id as string,
                    start: typedSchedule.start_time as string,
                    end: typedSchedule.end_time as string,
                    label: typedSchedule.label as string,
                    allDay: typedSchedule.all_day as boolean
                  });
                });
                
                // Update only the affected user's schedule
                setSchedules(prev => ({
                  ...prev,
                  [userId as number]: formattedSchedules
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
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        // Update the user data when it changes with proper type checking
        if (payload.new) {
          // Cast to a typed record for safety
          const updatedUser = payload.new as Record<string, any>;
          
          // Only update if we have a valid ID to compare against
          if (typeof updatedUser.id === 'number') {
            setUsers(prev => prev.map(user => 
              user.id === updatedUser.id ? { ...user, ...updatedUser } : user
            ));
          }
        }
      })
      .subscribe();

    return () => {
      getSupabase().removeChannel(scheduleSubscription);
      getSupabase().removeChannel(usersSubscription);
    };
  }, []);

  // Handle UI setup, event listeners, and cleanup
  useEffect(() => {
    // Check if mobile view
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Get current user name
    const storedName = localStorage.getItem('userName')
    if (storedName) {
      setCurrentUserName(storedName)
    }
    
    // Get used colors
    setUsedColors(users.map(user => user.color))
    
    // Add event listener for the custom color picker modal event
    const handleOpenColorPickerModal = (event: CustomEvent<{userName: string}>) => {
      // Find the user by name
      const user = users.find(u => u.name === event.detail.userName)
      if (user) {
        // Open the color picker modal for this user
        setSelectedUser(user)
        setIsColorPickerOnly(true)
        setModalOpen(true)
      }
    }
    
    window.addEventListener("openColorPicker", handleOpenColorPickerModal as EventListener)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener("openColorPicker", handleOpenColorPickerModal as EventListener)
      // Clean up dashboard controls if they exist
      const dashboardControls = document.getElementById('weekly-schedule-controls')
      if (dashboardControls) {
        dashboardControls.innerHTML = ''
      }
    }
  }, [users]) // Only re-run this effect if users change
  
  // Separate useEffect for scroll handling to prevent infinite loops
  useEffect(() => {
    // Add scroll event listener for header animation
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Only update state if there's an actual change in visibility needed
      if (currentScrollY < 10) {
        // Always show header at the top of the page
        if (!headerVisible) {
          setHeaderVisible(true)
        }
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        if (headerVisible) {
          setHeaderVisible(false)
        }
      } else {
        // Scrolling up - show header
        if (!headerVisible) {
          setHeaderVisible(true)
        }
      }
      
      // Only update lastScrollY if it's actually different
      if (currentScrollY !== lastScrollY) {
        setLastScrollY(currentScrollY)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [headerVisible, lastScrollY]) // Only re-run if these dependencies change

  // Update users when initialUsers changes
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  // Update used colors whenever users change
  useEffect(() => {
    const colors = users.map((user) => user.color)
    setUsedColors(colors)
  }, [users])

  // Helper function to convert a time string (HH:MM) to a position percentage
  // This is the core time calculation function used throughout the component
  const timeToPosition = (timeString: string, secondsOffset: number = 0): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    // Include seconds for more precise positioning if provided
    let totalMinutes = hours * 60 + minutes + (secondsOffset / 60)
    
    // For hours 0-5 (12am-5:59am), add 24 hours to place them after the 6pm-11:59pm time slots
    if (hours >= 0 && hours < 6) {
      totalMinutes += 24 * 60 // Add 24 hours in minutes
    }
    
    // Our visible range is 6am to 6am next day (24 hours)
    const startMinutes = 6 * 60 // 6am
    const totalDuration = 24 * 60 // 24 hours
    
    // Calculate position as percentage of the timeline
    return ((totalMinutes - startMinutes) / totalDuration) * 100
  }

  // Add a toggle function after the timeToPosition function
  const toggleView = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    // Save to localStorage
    localStorage.setItem('weeklyScheduleCollapsed', String(newState))
  }

  // Toggle between 12-hour and 24-hour time format
  const toggleTimeFormat = () => {
    const newFormat = !use24HourFormat
    setUse24HourFormat(newFormat)
    localStorage.setItem('use24HourFormat', newFormat.toString())
    
    // Update all time inputs in the document
    const timeInputs = document.querySelectorAll('input[type="time"]')
    timeInputs.forEach(input => {
      const htmlInput = input as HTMLInputElement
      htmlInput.setAttribute('data-time-format', newFormat ? '24h' : '12h')
    })
    
    // Dispatch event to notify other components
    const event = new CustomEvent('timeFormatChange', {
      detail: { use24Hour: newFormat }
    })
    window.dispatchEvent(event)
    
    if (onTimeFormatChange) {
      onTimeFormatChange(newFormat)
    }
  }

  // Format hour based on selected format
  const formatHour = (hour: number): string => {
    // Handle hours 0-6 as "next day"
    const isNextDay = hour >= 30; // Hours 30-31 represent 6am-7am next day
    const displayHour = isNextDay ? hour - 24 : hour;
    
    if (use24HourFormat) {
      if (displayHour === 24 || displayHour === 0) {
        return isNextDay ? "00*" : "00"
      }
      if (displayHour > 24) {
        return `${displayHour - 24}${isNextDay ? "*" : ""}`
      }
      return `${displayHour}${isNextDay ? "*" : ""}`
    } else {
      // AM/PM format
      if (displayHour === 0 || displayHour === 24) {
        return `12am${isNextDay ? "*" : ""}`
      }
      if (displayHour === 12) {
        return `12pm${isNextDay ? "*" : ""}`
      }
      if (displayHour > 12 && displayHour < 24) {
        return `${displayHour - 12}pm${isNextDay ? "*" : ""}`
      }
      if (displayHour >= 24) {
        return `${displayHour - 24}am${isNextDay ? "*" : ""}`
      }
      return `${displayHour}am${isNextDay ? "*" : ""}`
    }
  }

  // Format time string (HH:MM) based on selected format
  const formatTimeDisplay = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":")
    const hour = parseInt(hours)
    
    // Early morning hours (0-6) are considered part of the previous day's timeline
    const isEarlyMorning = hour >= 0 && hour < 6
    
    if (use24HourFormat) {
      // 24-hour format
      return `${timeString}${isEarlyMorning ? "*" : ""}`
    } else {
      // AM/PM format
      if (hour === 0) {
        return `12:${minutes}am${isEarlyMorning ? "*" : ""}`
      }
      if (hour === 12) {
        return `12:${minutes}pm${isEarlyMorning ? "*" : ""}`
      }
      if (hour > 12) {
        return `${hour - 12}:${minutes}pm${isEarlyMorning ? "*" : ""}`
      }
      return `${hour}:${minutes}am${isEarlyMorning ? "*" : ""}`
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

  // Get smart default start and end times based on current view and existing time blocks
  const getDefaultTimes = (day?: string, userId?: number): { start: string, end: string } => {
    // Format hours as strings with leading zeros
    const formatHour = (hour: number) => hour.toString().padStart(2, '0')
    const formatMinutes = (minutes: number) => minutes.toString().padStart(2, '0')
    
    // Check if we have existing time blocks for this day and user
    if (day && userId && schedules[userId] && schedules[userId][day] && schedules[userId][day].length > 0) {
      // Find the latest end time from existing blocks
      let latestEndTime = '00:00'
      let latestEndBlock = null
      
      for (const block of schedules[userId][day]) {
        // Skip all-day events when determining latest end time
        if (block.allDay) continue
        
        if (block.end > latestEndTime) {
          latestEndTime = block.end
          latestEndBlock = block
        }
      }
      
      if (latestEndBlock) {
        // Parse the end time
        const [endHourStr, endMinuteStr] = latestEndTime.split(':')
        let endHour = parseInt(endHourStr)
        let endMinute = parseInt(endMinuteStr)
        
        // Use the end time as the start time for the new block
        const startHour = endHour
        const startMinute = endMinute
        
        // End time is 4 hours after start time
        endHour = startHour + 4
        
        // Handle overflow to next day
        if (endHour >= 24) {
          endHour = 23
          endMinute = 59
        }
        
        return {
          start: `${formatHour(startHour)}:${formatMinutes(startMinute)}`,
          end: `${formatHour(endHour)}:${formatMinutes(endMinute)}`
        }
      }
    }
    
    // Fallback to default behavior if no existing blocks or if day/userId not provided
    const now = new Date()
    const currentHour = now.getHours()
    
    // Default to current hour or 9am if before 6am or after 8pm
    let startHour = (currentHour < 6 || currentHour > 20) ? 9 : currentHour
    
    // End time is 4 hours after start time, but not past 11:59pm
    let endHour = Math.min(startHour + 4, 23)
    let endMinute = endHour === 23 ? 59 : 0
    
    return {
      start: `${formatHour(startHour)}:00`,
      end: `${formatHour(endHour)}:${formatMinutes(endMinute)}`
    }
  }
  
  // Handle opening the modal when clicking on a user
  const handleUserClick = (user: User, day: string) => {
    // Only allow editing your own schedule
    if (user.name === currentUserName) {
      const { start, end } = getDefaultTimes(day, user.id)
      setSelectedUser(user)
      setSelectedDay(day)
      setEditMode(false)
      setSelectedTimeBlock({
        id: crypto.randomUUID(),
        start,
        end,
        label: "Work",
        allDay: false
      })
      setIsColorPickerOnly(false) // Make sure it's in regular mode
      setModalOpen(true)
    }
  }

  // Open the color picker in color-only mode
  const openColorPicker = (user: User) => {
    if (user.name === currentUserName) {
      setSelectedUser(user)
      setSelectedDay("") // Not needed for color picker
      setIsColorPickerOnly(true) // Switch to color-only mode
      setModalOpen(true)
    }
  }

  /**
   * Common function to open the modal with consistent behavior
   * Used by both the + button and clicking directly on time blocks
   */
  const openScheduleModal = (
    user: User, 
    day: string, 
    isEdit: boolean, 
    timeBlockData: TimeBlock | null
  ) => {
    if (user.name === currentUserName) {
      // First, close any open modal to reset state
      setModalOpen(false)
      
      // Create appropriate time block data
      let modalTimeBlock: TimeBlock;
      
      if (isEdit && timeBlockData) {
        // For edit mode: ensure valid UUID
        modalTimeBlock = {...timeBlockData}
        if (!modalTimeBlock.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modalTimeBlock.id)) {
          console.warn('Time block has invalid UUID, generating a new one for modal');
          modalTimeBlock.id = crypto.randomUUID();
        }
        console.log('Opening edit modal for:', modalTimeBlock);
      } else {
        // For add mode: create new time block with defaults
        const { start, end } = getDefaultTimes(day, user.id)
        modalTimeBlock = {
          id: crypto.randomUUID(),
          start,
          end,
          label: "Work",
          allDay: false
        }
        console.log('Opening add modal with defaults:', modalTimeBlock);
      }
      
      // Set all state BEFORE opening modal
      setEditMode(isEdit)
      setSelectedUser(user)
      setSelectedDay(day)
      setSelectedTimeBlock(modalTimeBlock)
      
      // Small delay to ensure state is updated before modal opens
      setTimeout(() => {
        setModalOpen(true)
      }, 20)
    }
  }

  // Handle opening the modal when clicking on the + button
  const handleAddClick = (user: User, day: string) => {
    // Close any previously open modal completely before opening a new one
    setModalOpen(false);
    
    // For debugging - log that this specific handler was called
    console.log('handleAddClick specifically called for user:', user.name, 'day:', day);
    
    // Small delay to ensure modal is fully closed before reopening
    setTimeout(() => {
      // Find the latest end time from existing blocks for this user and day
      let startTime = "09:00"; // Default start time if no previous blocks
      let endTime = "13:00";   // Default end time (4 hours later)
      
      // Check if we have existing time blocks for this day and user
      if (schedules[user.id] && schedules[user.id][day] && schedules[user.id][day].length > 0) {
        // Find the latest end time from existing blocks
        let latestEndTime = "00:00";
        
        for (const block of schedules[user.id][day]) {
          // Skip all-day events when determining latest end time
          if (block.allDay) continue;
          
          if (block.end > latestEndTime) {
            latestEndTime = block.end;
          }
        }
        
        if (latestEndTime !== "00:00") {
          // Use the latest end time as the start time for the new block
          startTime = latestEndTime;
          
          // Calculate end time (4 hours later)
          const [endHourStr, endMinuteStr] = latestEndTime.split(':');
          let endHour = parseInt(endHourStr);
          let endMinute = parseInt(endMinuteStr);
          
          // Add 4 hours
          endHour = endHour + 4;
          
          // Handle overflow to next day
          if (endHour >= 24) {
            endHour = 23;
            endMinute = 59;
          }
          
          // Format the end time
          endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        }
      }
      
      // Set editMode to true to ensure all 3 buttons (Delete, Cancel, Update) are shown
      setEditMode(true);
      setSelectedUser(user);
      setSelectedDay(day);
      setSelectedTimeBlock({
        id: crypto.randomUUID(),
        start: startTime,
        end: endTime,
        label: "Work",
        allDay: false
      });
      
      // Open the modal
      setModalOpen(true);
    }, 50);
  }

  // Handle clicking on a time block - navigate to edit page
  const handleTimeBlockClick = (user: User, day: string, timeBlock: TimeBlock) => {
    // Get the current path to use as the 'from' parameter
    const currentPath = encodeURIComponent(window.location.pathname);
    
    // Navigate to the edit page with the user's name and day as query parameters
    window.location.href = `/schedule/edit?from=${currentPath}&user=${encodeURIComponent(user.name)}&day=${encodeURIComponent(day)}`;
  }

  // Close the modal and reset state
  const handleModalClose = () => {
    console.log('Closing modal, current editMode:', editMode);
    setModalOpen(false)
    setIsColorPickerOnly(false) // Reset to regular mode when closing
    // Reset all modal state with a delay to avoid UI flicker
    setTimeout(() => {
      setEditMode(false)
      setSelectedTimeBlock(undefined)
    }, 300)
  }

  // Check if a time block overlaps with existing time blocks
  const checkOverlap = (day: string, timeBlock: TimeBlock, excludeId?: string): { hasOverlap: boolean, overlappingBlock?: TimeBlock } => {
    const userId = selectedUser?.id
    // Type guard to ensure userId exists and schedules are properly typed
    if (!userId || !schedules[userId as number] || !schedules[userId as number][day]) return { hasOverlap: false }
    
    // For each existing block on this day
    for (const existingBlock of schedules[userId as number][day]) {
      // Skip the current block being edited
      if (excludeId && existingBlock.id === excludeId) continue
      
      // Both blocks are all-day events - they definitely overlap
      if (timeBlock.allDay && existingBlock.allDay) {
        return { hasOverlap: true, overlappingBlock: existingBlock }
      }
      
      // Only the new block is an all-day event - it overlaps with all existing events
      if (timeBlock.allDay) {
        return { hasOverlap: true, overlappingBlock: existingBlock }
      }
      
      // Only the existing block is an all-day event - it overlaps with all new events
      if (existingBlock.allDay) {
        return { hasOverlap: true, overlappingBlock: existingBlock }
      }
      
      // Neither is all-day, check time overlap
      const timeStart = new Date(`2000-01-01T${timeBlock.start}`)
      const timeEnd = new Date(`2000-01-01T${timeBlock.end}`)
      const existingStart = new Date(`2000-01-01T${existingBlock.start}`)
      const existingEnd = new Date(`2000-01-01T${existingBlock.end}`)
      
      // Check if there's an overlap - times can be equal (e.g., end of one = start of another) without overlapping
      if (timeStart < existingEnd && timeEnd > existingStart) {
        return { hasOverlap: true, overlappingBlock: existingBlock }
      }
    }
    
    return { hasOverlap: false }
  }

  // Handle saving the schedule from the modal
  const handleSaveSchedule = async (day: string, timeBlock: TimeBlock) => {
    if (!selectedUser) return

    const userId = selectedUser.id
    const updatedSchedules = { ...schedules }
    const userIdNum = userId as number
    
    // Create the user's schedule object if it doesn't exist yet
    if (!updatedSchedules[userIdNum]) {
      updatedSchedules[userIdNum] = {}
    }
    
    // Create the day array if it doesn't exist yet
    if (!updatedSchedules[userIdNum][day]) {
      updatedSchedules[userIdNum][day] = []
    }
    
    // Check for overlapping time blocks (exclude current block if editing)
    const { hasOverlap, overlappingBlock } = checkOverlap(day, timeBlock, editMode ? selectedTimeBlock?.id : undefined)
    
    if (hasOverlap && overlappingBlock) {
      const overlappingTime = overlappingBlock.allDay 
        ? "all day" 
        : `${overlappingBlock.start} - ${overlappingBlock.end}`;
      
      alert(`This schedule overlaps with an existing time block: "${overlappingBlock.label}" (${overlappingTime})\n\nPlease choose a different time.`);
      return;
    }

    console.log('Saving timeBlock:', timeBlock)

    try {
      // If editing, replace the existing time block
      if (editMode && selectedTimeBlock?.id) {
        console.log('Editing existing timeBlock with ID:', selectedTimeBlock.id)
        
        // First update the local state for immediate feedback
        updatedSchedules[userIdNum][day] = updatedSchedules[userIdNum][day].map((block) =>
          block.id === selectedTimeBlock.id ? { 
            id: selectedTimeBlock.id,
            start: timeBlock.start,
            end: timeBlock.end,
            label: timeBlock.label,
            allDay: timeBlock.allDay || false
          } : block
        )
        
        // Then update in Supabase
        const { data: updatedData, error: updateError } = await getSupabase()
          .from('schedules')
          .update({
            start_time: timeBlock.start,
            end_time: timeBlock.end,
            label: timeBlock.label,
            all_day: timeBlock.allDay || false
          })
          .eq('id', selectedTimeBlock.id)
          .select(); // Return the updated row to confirm changes

        if (updateError) {
          console.error('Error updating schedule in Supabase:', updateError);
        } else {
          console.log('Successfully updated schedule in Supabase:', updatedData);
        }
      } else {
        console.log('Creating new timeBlock')
        
        // First create a temporary ID and update local state for immediate feedback
        const tempId = crypto.randomUUID();
        updatedSchedules[userIdNum][day].push({ 
          id: tempId,
          start: timeBlock.start,
          end: timeBlock.end,
          label: timeBlock.label,
          allDay: timeBlock.allDay || false
        });
        
        // Then create in Supabase
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
          // Already updated local state above
        } else if (insertedData && insertedData.length > 0) {
          console.log('Successfully inserted schedule in Supabase:', insertedData);
          
          // Update the temporary ID with the real one from Supabase
          const newId = insertedData[0].id as string;
          updatedSchedules[userIdNum][day] = updatedSchedules[userIdNum][day].map(block => 
            block.id === tempId ? {
              id: newId,
              start: insertedData[0].start_time as string,
              end: insertedData[0].end_time as string,
              label: insertedData[0].label as string,
              allDay: insertedData[0].all_day as boolean
            } : block
          );
        }
      }

      // Update local state immediately
      setSchedules(updatedSchedules)

      // Save to localStorage as a fallback
      localStorage.setItem('roommate-schedules', JSON.stringify(updatedSchedules))
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
    
    // Give time for the UI to update and Supabase changes to sync
    // before closing the modal
    setTimeout(() => {
      setModalOpen(false)
    }, 300)
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
    const userIdNum = userId as number
    
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
    if (newSchedules[userIdNum] && newSchedules[userIdNum][day]) {
      // Filter out the time block with the matching ID
      newSchedules[userIdNum][day] = newSchedules[userIdNum][day].filter((block) => block.id !== timeBlockId)

      // Update local state
      setSchedules(newSchedules)

      // Save to localStorage as a fallback
      localStorage.setItem('roommate-schedules', JSON.stringify(newSchedules))
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

  // Navigate to the previous day
  const goToPreviousDay = (currentDay: string) => {
    const currentIndex = days.indexOf(currentDay);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : days.length - 1;
    return days[prevIndex];
  };
  
  // Navigate to the next day
  const goToNextDay = (currentDay: string) => {
    const currentIndex = days.indexOf(currentDay);
    const nextIndex = currentIndex < days.length - 1 ? currentIndex + 1 : 0;
    return days[nextIndex];
  };

  // Handle day header click to scroll to next day
  const handleDayHeaderClick = (day: string) => {
    // Find the next day's element
    const nextDay = goToNextDay(day);
    const nextDayElement = document.getElementById(`day-header-${nextDay}`);
    
    if (nextDayElement) {
      // Scroll to the next day with smooth behavior
      nextDayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle double-click to scroll to previous day
  const handleDayHeaderDoubleClick = (day: string) => {
    // Find the previous day's element
    const prevDay = goToPreviousDay(day);
    const prevDayElement = document.getElementById(`day-header-${prevDay}`);
    
    if (prevDayElement) {
      // Scroll to the previous day with smooth behavior
      prevDayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Helper function to check if the current day is in the visible week
  // Returns the day to show the current time indicator on
  const getCurrentTimeDay = () => {
    const today = new Date()
    const hours = today.getHours()
    
    // If time is between midnight and 6am, show on previous day
    let adjustedDate = new Date(today)
    if (hours < 6) {
      adjustedDate.setDate(today.getDate() - 1)
    }
    
    const dayOfWeek = adjustedDate.getDay() // 0 = Sunday, 1 = Monday, ...
    const dayName = days[dayOfWeek] // With Sunday as first day, we can use dayOfWeek directly
    
    // For debugging - log today's date and the current day name
    console.log('Current date:', today.toDateString(), 'Day name:', dayName)
    console.log('Current time:', today.toTimeString())
    
    // Check if the current week includes the adjusted date
    const weekStart = new Date(currentWeek)
    weekStart.setDate(currentWeek.getDate() - currentWeek.getDay()) // Start of week (Sunday)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
    
    // For debugging - log the week range
    console.log('Week start:', weekStart.toDateString())
    console.log('Week end:', weekEnd.toDateString())
    console.log('Current week prop:', currentWeek.toDateString())
    
    // Check if today is in the current week range
    const isInCurrentWeek = (
      (adjustedDate >= weekStart && adjustedDate <= weekEnd) || 
      (today >= weekStart && today <= weekEnd)
    )
    
    console.log('Is in current week:', isInCurrentWeek)
    
    // Always return the current day name for debugging
    return dayName
  }
  
  // Helper function to get the current time position as a percentage
  const getCurrentTimePosition = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    
    // Format the current time as a string HH:MM
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    // Use our common timeToPosition function with seconds precision
    // This ensures perfect alignment with time blocks and hour markers
    const position = timeToPosition(timeString, seconds)
    
    return Math.min(Math.max(0, position), 100) // Clamp between 0-100%
  }

  return (
    <div className="w-full">
      {/* Make the Weekly Schedule header sticky - use same position for mobile and desktop */}
      <div 
        className={`fixed top-[57px] left-0 right-0 z-40 bg-[#242424] border-b border-[#333333] w-full overflow-hidden shadow-md opacity-90 transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`} 
        data-component-name="WeeklySchedule"
      >
        <div className="flex justify-between items-center h-[36px] w-full max-w-7xl mx-auto px-4">
          <div>
            <h3 className="text-sm font-medium">Week of {formatWeekRange(currentWeek)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newFormat = !use24HourFormat
                setUse24HourFormat(newFormat)
                localStorage.setItem('use24HourFormat', newFormat.toString())
                // Notify parent components about the time format change
                if (onTimeFormatChange) {
                  onTimeFormatChange(newFormat)
                }
                // Dispatch an event for other components to listen to
                window.dispatchEvent(new CustomEvent('timeFormatChange', { detail: { use24Hour: newFormat } }))
              }}
              className="h-8 w-8 text-white md:hover:bg-white md:hover:text-black"
              id="toggle-time-format"
              title={use24HourFormat ? "Switch to AM/PM format" : "Switch to 24-hour format"}
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newState = !isCollapsed
                setIsCollapsed(newState)
                localStorage.setItem('weeklyScheduleCollapsed', String(newState))
              }}
              className="h-8 w-8 text-white md:hover:bg-white md:hover:text-black"
              id="toggle-view"
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

      {days.map((day, dayIndex) => (
        <div key={day} className="mb-4">
          {/* Day header - stays sticky below the WeeklySchedule header - use same position for mobile and desktop */}
          <div 
            id={`day-header-${day}`}
            className={`sticky top-[93px] z-30 ${useAlternatingBg && dayIndex % 2 === 1 ? 'bg-[#1A1A1A]' : 'bg-[#282828]'} cursor-pointer hover:bg-opacity-80 mb-2 shadow-sm`}
            onClick={() => handleDayHeaderClick(day)}
            onDoubleClick={() => handleDayHeaderDoubleClick(day)}
            onTouchStart={(e) => {
              // Track touch for potential double-tap
              const touchTarget = e.currentTarget;
              const lastTouch = touchTarget.getAttribute('data-last-touch') || '0';
              const now = new Date().getTime();
              const timeSince = now - parseInt(lastTouch);
              
              if (timeSince < 300 && timeSince > 0) {
                // Double tap detected
                e.preventDefault();
                handleDayHeaderDoubleClick(day);
              }
              
              touchTarget.setAttribute('data-last-touch', now.toString());
            }}
            role="button"
            tabIndex={0}
            aria-label={`${day} - Click to go to next day, double-click to go to previous day`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDayHeaderClick(day);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleDayHeaderClick(day);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleDayHeaderDoubleClick(day);
              }
            }}
          >
            <div className="flex justify-between items-center pr-1">
              <h4 
                className={`text-sm font-medium h-[36px] flex items-center ${getCurrentTimeDay() === day ? 'text-red-500 pl-4 border-l-4 border-red-500 animate-pulse-subtle' : 'pl-4'}`} 
                data-component-name="WeeklySchedule"
              >
                {day.substring(0, 3)}
                {/* Check if this is the current day and add the date, otherwise add day number */}
                {(() => {
                  // Get the day index (0-6, Monday-Sunday)
                  const dayIndex = days.indexOf(day);
                  
                  // Get the date for this day based on the current week
                  const date = new Date(currentWeek);
                  // With Sunday as first day (index 0), we can directly use dayIndex
                  date.setDate(date.getDate() - date.getDay() + dayIndex);
                  
                  // Get the day of month
                  const dayOfMonth = date.getDate();
                  
                  // Check if this date is today
                  const today = new Date();
                  const isToday = date.getDate() === today.getDate() && 
                                  date.getMonth() === today.getMonth() && 
                                  date.getFullYear() === today.getFullYear();
                  
                  if (isToday) {
                    // Just show the day number with a bullet point
                    return (
                      <span className="ml-1 font-bold text-xs text-red-500" data-component-name="WeeklySchedule">
                        {` • ${dayOfMonth}`}
                      </span>
                    );
                  } else {
                    // For non-current days, add the day number with a hyphen
                    return (
                      <span className="ml-1 font-bold text-xs" data-component-name="WeeklySchedule">
                        {` - ${dayOfMonth}`}
                      </span>
                    );
                  }
                  return null;
                })()}
              </h4>
              
              {/* No toggle buttons in desktop view as requested */}
            </div>
          </div>

          {/* No duplicate day header needed */}

          {/* Scrollable container for both time header and user content */}
          <div className="md:overflow-visible overflow-x-auto scrollbar-hide">
            <div className={`min-w-[800px] md:min-w-0 pl-2 pr-1 ${useAlternatingBg && dayIndex % 2 === 1 ? 'bg-[#1A1A1A]' : ''}`}>
              {/* Time header - add padding-top to prevent overlapping */}
              <div className="bg-[#282828] mb-2 pt-1">
                <div className="relative h-6 overflow-visible">
                  <div className="absolute inset-0 flex overflow-visible">
                    {/* Current time indicator - always show on the current day */}
                    {/* Force the indicator to show on Saturday for May 10, 2025 */}
                    {(getCurrentTimeDay() === day || (day === "Saturday" && new Date().getDate() === 10 && new Date().getMonth() === 4 && new Date().getFullYear() === 2025)) && (
                      <div 
                        className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 overflow-visible animate-pulse-subtle" 
                        style={{ 
                          left: `${getCurrentTimePosition()}%`,
                          height: isCollapsed ? 'calc(100% + 7.5rem)' : 'calc(100% + 16rem)', // Tall enough to reach the 3rd user's row in collapsed mode
                          transformOrigin: 'top', // Ensure line grows from top
                          position: 'absolute',
                          top: 0
                        }}
                      >
                        {/* Red dot always at the top of the line, regardless of mobile or desktop */}
                        <div 
                          className="absolute w-[10px] h-[10px] rounded-full bg-red-500 animate-pulse-subtle"
                          style={{
                            top: '-4px',
                            left: '-4px',
                            position: 'absolute',
                            zIndex: 55, // Ensure it's above the line and time labels
                            pointerEvents: 'none' // Prevent it from blocking interactions
                          }}
                          data-component-name="WeeklySchedule"
                        ></div>
                      </div>
                    )}
                    
                    {/* Render hour markers using the same positioning function as grid lines and time indicator */}
                    {hours.map((hour, hourIndex) => {
                      // Only show hours that should be visible based on screen width
                      if (!getVisibleHours().includes(hour)) return null;
                      
                      // Format hour as HH:00 for timeToPosition
                      const hourString = `${hour.toString().padStart(2, '0')}:00`
                      // Calculate exact position using the same function as time indicator and grid lines
                      const position = timeToPosition(hourString)
                      
                      return (
                        <div 
                          key={`hour-timeline-${hour}-${hourIndex}`} 
                          className="absolute top-0 text-[10px] text-[#666666] whitespace-nowrap z-40"
                          style={{ left: `${position}%` }}
                          data-component-name="WeeklySchedule"
                        >
                          {formatHour(hour)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* User schedules */}
              {users.map((user) => {
                const userSchedule = schedules[user.id][day] || []
                const isCurrentUser = user.name === currentUserName

                return (
                  <div key={`${day}-${user.id}`} className="mb-4 relative z-10">
                    <div className="flex items-center justify-between mb-1 pl-1">
                      <div
                        className="flex items-center gap-2"
                      >
                        {isCollapsed ? (
                          <span
                            className="flex items-center justify-center h-3 w-3 rounded-full cursor-pointer"
                            style={{ backgroundColor: user.color }}
                            onClick={(e) => {
                              if (isCurrentUser) {
                                e.stopPropagation(); // Stop event from bubbling up
                                openColorPicker(user);
                              }
                            }}
                            title={user.name}
                          />
                        ) : (
                          <span
                            className="flex items-center justify-center h-6 w-6 rounded-full text-sm font-semibold cursor-pointer"
                            style={{ backgroundColor: user.color, color: getTextColor(user.color) }}
                            onClick={(e) => {
                              if (isCurrentUser) {
                                e.stopPropagation(); // Stop event from bubbling up
                                openColorPicker(user);
                              }
                            }}
                            title={isCurrentUser ? "Click to change your color" : user.name}
                            data-component-name="WeeklySchedule"
                          >
                            {user.initial}
                          </span>
                        )}
                        {!isCollapsed && (
                          <span 
                            className="text-sm" 
                            style={{ color: user.color }}
                            data-component-name="WeeklySchedule"
                          >
                            {user.name}
                            {isCurrentUser && " (You)"}
                          </span>
                        )}
                      </div>

                       {/* User display only - button removed as requested */}
                    </div>

                    {/* Adjust the height based on collapsed state */}
                      <div
                        className={`relative ${
                          isCollapsed ? "h-2" : "h-10"
                        } bg-[#373737] rounded-md overflow-hidden transition-all duration-200 flex-grow`}
                      data-component-name="WeeklySchedule"
                    >
                      {/* Vertical grid lines - positioned exactly at hour marks */}
                      <div className="absolute inset-0 h-full w-full pointer-events-none">
                        {hours.map((hour, gridIndex) => {
                          // Format hour as HH:00 for timeToPosition
                          const hourString = `${hour.toString().padStart(2, '0')}:00`
                          // Calculate exact position using the same function as time indicator
                          const position = timeToPosition(hourString)
                          
                          return (
                            <div 
                              key={`grid-line-${hour}-${gridIndex}`} 
                              className="absolute top-0 bottom-0 border-l border-[#191919] h-full" 
                              style={{ left: `${position}%` }}
                            />
                          )
                        })}
                      </div>

                      {/* Schedule blocks */}
                      {userSchedule.map((block, index) => {
                        // For all-day events, span the entire width
                        let startPos, endPos, width;
                        
                        if (block.allDay) {
                          startPos = 0;
                          endPos = 100;
                          width = 100;
                        } else {
                          // Use our common timeToPosition function for consistent positioning
                          // This ensures perfect alignment with the time grid and current time indicator
                          startPos = timeToPosition(block.start)
                          endPos = timeToPosition(block.end)
                          
                          // Ensure minimum width for very short events and handle rounding
                          width = Math.max(endPos - startPos, 0.5) // Minimum width of 0.5%
                        }

                        return (
                          <div
                            key={block.id || index}
                            className={`absolute ${
                              isCollapsed ? "h-2" : "top-0 h-full bottom-0"
                            } rounded-md flex items-center justify-center transition-all duration-200 z-${block.allDay ? 5 : 10 + index} ${
                              isCurrentUser ? "cursor-pointer hover:opacity-90" : ""
                            }`}
                            style={{
                              left: `${startPos}%`,
                              width: `${width}%`,
                              backgroundColor: block.allDay ? 'transparent' : user.color,
                              color: block.allDay ? user.color : getTextColor(user.color),
                              top: isCollapsed ? "0" : undefined,
                              border: block.allDay ? `2px solid ${user.color}` : 'none',
                              backgroundImage: block.allDay ? `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.3) 5px, rgba(0,0,0,0.3) 10px)` : 'none',
                              zIndex: block.allDay ? 5 : 10 + (
                                block.start ? 
                                  parseInt(block.start.split(':')[0]) + 
                                  parseInt(block.start.split(':')[1]) / 60 
                                : 0
                              )
                            }}
                            title={`${block.label}${block.allDay ? " (All Day)" : `: ${formatTimeDisplay(block.start)} - ${formatTimeDisplay(block.end)}`}`}
                            onClick={() => isCurrentUser && handleTimeBlockClick(user, day, block)}
                          >
                            {!isCollapsed && width > 0 ? (
                              <div className={`flex flex-row items-center justify-start w-full h-full ${width < 10 ? 'pl-1' : 'pl-4'} overflow-hidden`} data-component-name="WeeklySchedule">
                                <div className="flex flex-row items-center justify-start overflow-hidden max-w-full">
                                  {!block.allDay ? (
                                    width < 20 ? (
                                      // For very narrow blocks, show only the label
                                      <div className="flex items-center max-w-full overflow-hidden">
                                        <span className="text-xs font-bold leading-tight overflow-hidden text-ellipsis whitespace-nowrap" data-component-name="WeeklySchedule">
                                          {block.label}
                                        </span>
                                        {isCurrentUser && width > 12 && (
                                          <Edit2 className="h-3 w-3 opacity-70 ml-1 flex-shrink-0" />
                                        )}
                                      </div>
                                    ) : (
                                      // For wider blocks, show time and label
                                      <>
                                        <span className="text-xs opacity-80 mr-1 font-bold leading-tight whitespace-nowrap" data-component-name="WeeklySchedule">
                                          {formatTimeDisplay(block.start)} - {formatTimeDisplay(block.end)}
                                        </span>
                                        <span className="text-xs opacity-60 mr-1">|</span>
                                        <div className="flex items-center max-w-full overflow-hidden">
                                          <span className="text-xs font-bold leading-tight overflow-hidden text-ellipsis whitespace-nowrap" data-component-name="WeeklySchedule">
                                            {block.label}
                                          </span>
                                          {isCurrentUser && width > 30 && (
                                            <Edit2 className="h-3 w-3 opacity-70 ml-1 flex-shrink-0" />
                                          )}
                                        </div>
                                      </>
                                    )
                                  ) : (
                                    <div className="flex items-center max-w-full overflow-hidden">
                                      <span className="text-xs font-bold leading-tight overflow-hidden text-ellipsis whitespace-nowrap" data-component-name="WeeklySchedule">
                                        {block.label}
                                        {" (All Day)"}
                                      </span>
                                      {isCurrentUser && width > 15 && (
                                        <Edit2 className="h-3 w-3 opacity-70 ml-1 flex-shrink-0" />
                                      )}
                                    </div>
                                  )}
                                </div>
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

      {/* Add padding at the bottom */}
      <div className="pb-8" />

      {/* Quick Schedule Modal */}
      {selectedUser && (
        <QuickScheduleModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteTimeBlock}
          userName={selectedUser.name}
          userColor={selectedUser.color}
          initialDay={selectedDay}
          editMode={editMode} // This controls if Delete button appears
          timeBlock={selectedTimeBlock}
          usedColors={usedColors}
          isColorPickerOnly={isColorPickerOnly} // Use the new color-only mode
          use24HourFormat={use24HourFormat} // Pass the time format preference
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