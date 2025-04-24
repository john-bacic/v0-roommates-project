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
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const hours = Array.from({ length: 22 }, (_, i) => i + 5) // 5 to 26 (2am)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Helper function to always return dark text for colored backgrounds
  const getTextColor = (bgColor: string) => {
    return "#000" // Always use dark text against colored backgrounds
  }

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
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

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

  useEffect(() => {
    // Check if mobile view
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check mobile on initial load
    checkMobile()
    
    // Listen for resize events
    window.addEventListener("resize", checkMobile)
    
    // Get current user name
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setCurrentUserName(storedName)
    }
    
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
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("openColorPicker", handleOpenColorPickerModal as EventListener)
      // Clean up dashboard controls if they exist
      const dashboardControls = document.getElementById('weekly-schedule-controls')
      if (dashboardControls) {
        dashboardControls.innerHTML = ''
      }
    }
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
    if (use24HourFormat) {
      if (hour === 24) {
        return "00"
      }
      if (hour > 24) {
        return `${hour - 24}`
      }
      return `${hour}`
    } else {
      // AM/PM format
      if (hour === 0 || hour === 24) {
        return "12am"
      }
      if (hour === 12) {
        return "12pm"
      }
      if (hour > 12 && hour < 24) {
        return `${hour - 12}pm`
      }
      if (hour >= 24) {
        return `${hour - 24}am`
      }
      return `${hour}am`
    }
  }

  // Format time string (HH:MM) based on selected format
  const formatTimeDisplay = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":")
    const hour = parseInt(hours)
    
    if (use24HourFormat) {
      // 24-hour format
      return timeString
    } else {
      // AM/PM format
      if (hour === 0) {
        return `12:${minutes}am`
      }
      if (hour === 12) {
        return `12:${minutes}pm`
      }
      if (hour > 12) {
        return `${hour - 12}:${minutes}pm`
      }
      return `${hour}:${minutes}am`
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

  // Get smart default start and end times based on current view
  const getDefaultTimes = (): { start: string, end: string } => {
    // Current hour rounded down
    const now = new Date()
    const currentHour = now.getHours()
    
    // Default to current hour or 9am if before 6am or after 8pm
    let startHour = (currentHour < 6 || currentHour > 20) ? 9 : currentHour
    
    // End time is 2 hours after start time, but not past 11pm
    let endHour = Math.min(startHour + 2, 23)
    
    // Format hours as strings with leading zeros
    const formatHour = (hour: number) => hour.toString().padStart(2, '0')
    
    return {
      start: `${formatHour(startHour)}:00`,
      end: `${formatHour(endHour)}:00`
    }
  }
  
  // Handle opening the modal when clicking on a user
  const handleUserClick = (user: User, day: string) => {
    // Only allow editing your own schedule
    if (user.name === currentUserName) {
      const { start, end } = getDefaultTimes()
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
        const { start, end } = getDefaultTimes()
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
      // Get default times for a new time block
      const { start, end } = getDefaultTimes();
      
      // Direct state setup matching the QuickScheduleModal from the image
      // Set editMode to true to ensure all 3 buttons (Delete, Cancel, Update) are shown
      setEditMode(true);
      setSelectedUser(user);
      setSelectedDay(day);
      setSelectedTimeBlock({
        id: crypto.randomUUID(),
        start,
        end,
        label: "Work",
        allDay: false
      });
      
      // Open the modal
      setModalOpen(true);
    }, 50);
  }

  // Handle opening the modal when clicking on a time block
  const handleTimeBlockClick = (user: User, day: string, timeBlock: TimeBlock) => {
    openScheduleModal(user, day, true, timeBlock);
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

  // Helper function to check if the current day is in the visible week
  // Returns the day to show the current time indicator on
  const getCurrentTimeDay = () => {
    const today = new Date()
    const hours = today.getHours()
    
    // If time is between midnight and 5am, show on previous day
    let adjustedDate = new Date(today)
    if (hours < 5) {
      adjustedDate.setDate(today.getDate() - 1)
    }
    
    const dayOfWeek = adjustedDate.getDay() // 0 = Sunday, 1 = Monday, ...
    const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1] // Convert to our days array index
    
    // Check if the current week includes the adjusted date
    const weekStart = new Date(currentWeek)
    weekStart.setDate(currentWeek.getDate() - currentWeek.getDay() + (currentWeek.getDay() === 0 ? -6 : 1)) // Start of week (Monday)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of week (Sunday)
    
    const isInCurrentWeek = (
      (adjustedDate >= weekStart && adjustedDate <= weekEnd) || 
      (today >= weekStart && today <= weekEnd)
    )
    
    return isInCurrentWeek ? dayName : null
  }
  
  // Helper function to get the current time position as a percentage
  const getCurrentTimePosition = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // Convert to decimal hours (e.g., 14:30 = 14.5)
    const decimalHours = hours + (minutes / 60)
    
    // Match the calculation used for hour markers: ((hour - 6) / 18) * 100
    // Our visible range is 6am to midnight (18 hours)
    let position
    
    // Handle times after midnight (0-5am)
    if (hours < 6) {
      // For hours 0-5, show them at the end of the previous day (after hour 24)
      position = ((hours + 24 - 6) / 18) * 100
    } else {
      // For normal hours (6am-11pm)
      position = ((decimalHours - 6) / 18) * 100
    }
    
    return Math.min(Math.max(0, position), 100) // Clamp between 0-100%
  }

  return (
    <div className="w-full">
      {/* Make the Weekly Schedule header sticky with no bottom padding */}
      <div className="sticky top-[57px] z-40 bg-[#282828] border-b border-[#333333] w-full overflow-hidden">
        <div className="flex justify-between items-center h-[36px] w-full">
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
        <div key={day} className="mb-8">
          {/* Day header - stays sticky */}
          <div className={`sticky top-[93px] z-30 ${useAlternatingBg && dayIndex % 2 === 1 ? 'bg-[#1A1A1A]' : 'bg-[#282828]'}`}>
            <div className="flex justify-between items-center pr-2">
              <h4 className="text-sm font-medium pl-2 h-[36px] flex items-center">{day}</h4>
              
              {/* No toggle buttons in desktop view as requested */}
            </div>
          </div>

          {/* Scrollable container for both time header and user content */}
          <div className="md:overflow-visible overflow-x-auto scrollbar-hide">
            <div className={`min-w-[800px] md:min-w-0 pl-2 ${useAlternatingBg && dayIndex % 2 === 1 ? 'bg-[#1A1A1A]' : ''}`}>
              {/* Time header - now scrolls with content */}
              <div className="bg-[#282828] mb-6">
                <div className="relative h-6">
                  <div className="absolute inset-0 flex">
                    {/* Current time indicator - only show in expanded mode or if this is the current day */}
                    {getCurrentTimeDay() === day && (!isCollapsed || day === getCurrentTimeDay()) && (
                      <div 
                        className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20" 
                        style={{ 
                          left: `${getCurrentTimePosition()}%`,
                          height: isCollapsed ? 'calc(100% + 10rem)' : 'calc(100% + 16rem)' // Slightly taller in expanded state
                        }}
                        data-component-name="WeeklySchedule"
                      >
                        <div className="absolute -top-1 -left-[4px] w-[10px] h-[10px] rounded-full bg-red-500" />
                      </div>
                    )}
                    
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
                  <div key={`${day}-${user.id}`} className="mb-4 relative z-10">
                    <div className="flex items-center justify-between mb-1 pl-1">
                      <div
                        className={`flex items-center gap-2 ${isCurrentUser ? "cursor-pointer hover:opacity-80" : ""}`}
                        onClick={() => isCurrentUser && handleUserClick(user, day)}
                      >
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
                        >
                          {user.initial}
                        </span>
                        <span className="text-sm">
                          {user.name}
                          {isCurrentUser && " (You)"}
                        </span>
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
                      {/* Vertical grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {hours.map((hour) => (
                          <div key={hour} className="flex-1 border-l border-[#191919] first:border-l-0 h-full" />
                        ))}
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
                          // Calculate the position and width of the time block
                          const startHour = parseInt(block.start.split(":")[0])
                          const startMinute = parseInt(block.start.split(":")[1])
                          const endHour = parseInt(block.end.split(":")[0])
                          const endMinute = parseInt(block.end.split(":")[1])
                          
                          // Calculate the start and end positions as percentages
                          // Adjust calculation to match the time row markers exactly
                          const hourWidth = 100 / hours.length
                          startPos = (startHour - hours[0]) * hourWidth + (startMinute / 60) * hourWidth
                          endPos = (endHour - hours[0]) * hourWidth + (endMinute / 60) * hourWidth
                          width = endPos - startPos
                        }

                        return (
                          <div
                            key={block.id || index}
                            className={`absolute ${
                              isCollapsed ? "h-2" : "top-0 h-full bottom-0"
                            } rounded-md flex items-center justify-center transition-all duration-200 z-10 ${
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
                            }}
                            title={`${block.label}${block.allDay ? " (All Day)" : `: ${block.start} - ${block.end}`}`}
                            onClick={() => isCurrentUser && handleTimeBlockClick(user, day, block)}
                          >
                            {!isCollapsed && width > 15 ? (
                              <div className="flex flex-row items-center justify-start w-full h-full pl-4">
                                <div className="flex flex-row items-center justify-start">
                                  {!block.allDay ? (
                                    <span className="text-xs opacity-80 mr-1 font-bold">
                                      {formatTimeDisplay(block.start)} - {formatTimeDisplay(block.end)}
                                    </span>
                                  ) : null}
                                  <span className="text-xs font-bold">
                                    {block.label}
                                    {block.allDay ? " (All Day)" : ""}
                                    {isCurrentUser && width > 30 && (
                                      <Edit2 className="h-3 w-3 opacity-70 ml-1 inline" />
                                    )}
                                  </span>
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
