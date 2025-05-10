"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Edit2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"
import { WeeklySchedule } from "@/components/weekly-schedule"
import Link from "next/link"
import Image from "next/image"
import { getSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { caveat } from "../fonts"

// Define types for the application
interface User {
  id: number;
  name: string;
  color: string;
  initial: string;
}

interface TimeBlock {
  id?: string;
  start: string;
  end: string;
  label: string;
  allDay?: boolean;
}

// Define Supabase response types
interface ScheduleRecord {
  id: string;
  user_id: number;
  day: string;
  start_time: string;
  end_time: string;
  label: string;
  all_day: boolean;
  created_at?: string;
}

// Type for Supabase response
type SupabaseData = Record<string, any>[]

// Define the days of the week as a type and constant array
type DayName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
const DAYS_OF_WEEK: DayName[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Define schedule types to match Supabase schema
type UserSchedule = Record<string, TimeBlock[]>;
type SchedulesType = Record<number, UserSchedule>;

// Initial users array
const initialUsers: User[] = [
  { id: 1, name: "Riko", color: "#FF7DB1", initial: "R" },
  { id: 2, name: "Narumi", color: "#63D7C6", initial: "N" },
  { id: 3, name: "John", color: "#F8D667", initial: "J" },
]

// Type guard function to check if an object is a valid user
function isValidUser(obj: unknown): obj is User {
  return obj !== null && 
         typeof obj === 'object' && 
         'id' in obj && 
         'name' in obj && 
         'color' in obj && 
         'initial' in obj;
}

export default function Dashboard() {
  // Always initialize currentWeek to today's date
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [userName, setUserName] = useState("")
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [userColor, setUserColor] = useState("#B388F5") // Default color
  const { toast } = useToast()
  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem('use24HourFormat')
      return savedFormat !== null ? savedFormat === 'true' : false
    }
    return false
  })
  
  // Force currentWeek to be today's date on initial load
  useEffect(() => {
    setCurrentWeek(new Date())
  }, [])
  
  // Check for refresh flags and refresh the dashboard when needed
  useEffect(() => {
    console.log('Dashboard mounted, checking for refresh flags');
    
    // Check for all possible refresh flags
    const shouldRefreshFromRoommates = sessionStorage.getItem('refreshDashboard') === 'true';
    const shouldRefreshFromEdit = sessionStorage.getItem('refreshAfterNavigation') === 'true';
    const dashboardNeedsRefresh = sessionStorage.getItem('dashboardNeedsRefresh') === 'true';
    
    // Check URL parameters for refresh request
    const urlParams = new URLSearchParams(window.location.search);
    const hasRefreshParam = urlParams.has('refresh');
    
    if (shouldRefreshFromRoommates || shouldRefreshFromEdit || dashboardNeedsRefresh || hasRefreshParam) {
      // Clear all refresh flags
      sessionStorage.removeItem('refreshDashboard');
      sessionStorage.removeItem('refreshAfterNavigation');
      sessionStorage.removeItem('dashboardNeedsRefresh');
      
      // Remove refresh parameter from URL without refreshing
      if (hasRefreshParam && window.history.replaceState) {
        const newUrl = window.location.pathname + 
                      (window.location.search ? 
                        window.location.search.replace(/[?&]refresh=[^&]*/, '') : '');
        window.history.replaceState({}, document.title, newUrl);
      }
      
      // Force a refresh of the page data
      console.log('Dashboard refreshing data after navigation');
      loadData();
    }
    
    // Also listen for the refreshTimeDisplays event from the edit page
    const handleRefreshEvent = () => {
      console.log('Received refreshTimeDisplays event');
      loadData();
    };
    
    document.addEventListener('refreshTimeDisplays', handleRefreshEvent);
    
    return () => {
      document.removeEventListener('refreshTimeDisplays', handleRefreshEvent);
    };
  }, []);
  
  // Add another effect to handle focus/visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const refreshTimestamp = sessionStorage.getItem('refreshTimestamp');
        if (refreshTimestamp) {
          // Only refresh if we haven't refreshed for this timestamp yet
          const lastProcessedTimestamp = sessionStorage.getItem('lastProcessedTimestamp');
          if (refreshTimestamp !== lastProcessedTimestamp) {
            console.log('Refreshing dashboard on visibility change');
            sessionStorage.setItem('lastProcessedTimestamp', refreshTimestamp);
            loadData();
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Apply the time format class to the document
  useEffect(() => {
    // Update document class
    if (use24HourFormat) {
      document.documentElement.classList.add('use-24h-time')
    } else {
      document.documentElement.classList.remove('use-24h-time')
    }
    
    // Save to localStorage
    localStorage.setItem('use24HourFormat', use24HourFormat.toString())
    
    // Dispatch event to notify all components
    const event = new CustomEvent('timeFormatChange', {
      detail: { use24Hour: use24HourFormat }
    })
    window.dispatchEvent(event)
    
    // Force refresh of time inputs to apply the new format
    const timeInputs = document.querySelectorAll('input[type="time"]')
    timeInputs.forEach(input => {
      const htmlInput = input as HTMLInputElement
      const currentValue = htmlInput.value
      // Update the data-time-format attribute
      htmlInput.setAttribute('data-time-format', use24HourFormat ? '24h' : '12h')
      // Force a refresh by temporarily changing the value
      const tempValue = currentValue === '00:00' ? '00:01' : '00:00'
      htmlInput.value = tempValue
      htmlInput.value = currentValue
    })
  }, [use24HourFormat])

  const [schedules, setSchedules] = useState<SchedulesType>({})
  const [loading, setLoading] = useState(true)

  // Function to load data from Supabase
  const loadData = async () => {
    setLoading(true)
    
    try {
      // Fetch users from Supabase
      const { data, error: usersError } = await getSupabase()
        .from('users')
        .select('*')
        
      // Ensure data is an array and filter for valid user objects
      const rawData = Array.isArray(data) ? data : []
      const usersData = rawData.filter(isValidUser)
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        // Fall back to initial users if there's an error
        setUsers(initialUsers)
      } else if (usersData && usersData.length > 0) {
        // Ensure the data matches the expected User type
        const typedUsers = usersData.map(user => ({
          id: typeof user.id === 'number' ? user.id : parseInt(String(user.id)),
          name: String(user.name || ''),
          color: String(user.color || '#BB86FC'),
          initial: String(user.initial || '')
        }))
        setUsers(typedUsers)
        
        // Set current user's color if they exist in the users list
        if (userName) {
          // Find the current user by name with safe type handling
          const currentUser = usersData.find(u => u && typeof u === 'object' && 'name' in u && String(u.name) === userName)
          if (currentUser && currentUser.color) {
            setUserColor(String(currentUser.color))
          }
        }
        
        // Fetch schedules for each user
        const schedulesData: Record<number, Record<string, Array<{
          id: string;
          start: string;
          end: string;
          label: string;
          allDay: boolean;
        }>>> = {}
        
        for (const user of usersData) {
          // Get schedules from Supabase with aggressive type assertion to fix TypeScript error
          // @ts-ignore - Bypass TypeScript check for Supabase response
          const response = await getSupabase()
            .from('schedules')
            .select('*')
            // @ts-ignore: Supabase type inference issue
            .eq('user_id', user.id)
          
          // Extract data and error from response
          const data = response.data
          const schedulesError = response.error
          
          // Ensure data is an array
          const userSchedules = Array.isArray(data) ? data : []
            
          // Map the data to ensure it has the correct structure
          const typedSchedules = userSchedules.map((schedule: any) => ({
            id: String(schedule?.id || ''),
            user_id: typeof schedule?.user_id === 'number' ? schedule.user_id : parseInt(String(schedule?.user_id || '0')),
            day: String(schedule?.day || ''),
            start_time: String(schedule?.start_time || ''),
            end_time: String(schedule?.end_time || ''),
            label: String(schedule?.label || ''),
            all_day: Boolean(schedule?.all_day),
            created_at: String(schedule?.created_at || '')
          }))
          
          if (!schedulesError && typedSchedules.length > 0) {
            // Transform the data into the format expected by the app
            const formattedSchedules: Record<string, Array<{
              id: string;
              start: string;
              end: string;
              label: string;
              allDay: boolean;
            }>> = {}
            
            typedSchedules.forEach(schedule => {
              const day = String(schedule.day || '')
              if (!formattedSchedules[day]) {
                formattedSchedules[day] = []
              }
              
              formattedSchedules[day].push({
                id: String(schedule.id || ''),
                start: String(schedule.start_time || ''),
                end: String(schedule.end_time || ''),
                label: String(schedule.label || ''),
                allDay: Boolean(schedule.all_day)
              })
            })
            
            // Ensure user.id is treated as a number key
            const userId = typeof user.id === 'number' ? user.id : parseInt(String(user.id))
            schedulesData[userId] = formattedSchedules
          }
        }
        
        setSchedules(schedulesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time subscriptions to schedule and user changes
  useEffect(() => {
    const scheduleSubscription = getSupabase()
      .channel('schedules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        // Reload data when any schedule changes
        loadData()
      })
      .subscribe()
      
    // Subscribe to user changes to update colors in real-time
    const userSubscription = getSupabase()
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload: { new?: Record<string, any> }) => {
        // When a user record changes, check if it's the current user and update color if needed
        if (payload.new && typeof payload.new === 'object' && 'name' in payload.new && 'color' in payload.new) {
          // Check if this is the current user
          if (userName === String(payload.new.name)) {
            setUserColor(String(payload.new.color))
          }
        }
        
        // Reload all user data to ensure everything is in sync
        loadData()
      })
      .subscribe()

    return () => {
      getSupabase().removeChannel(scheduleSubscription)
      getSupabase().removeChannel(userSubscription)
    }
  }, [userName])

  useEffect(() => {
    // Check if window is defined (client-side only)
    if (typeof window !== 'undefined') {
      // Get the user's name from localStorage (we'll keep this for user preference)
      const storedName = localStorage.getItem("userName")
      if (storedName) {
        setUserName(storedName)
        
        // Immediately check for the user's color in Supabase
        const fetchUserColor = async () => {
          try {
            const { data, error } = await getSupabase()
              .from('users')
              .select('color')
              .eq('name', storedName) // Use storedName directly since it's guaranteed to exist here
              .single()
            
            if (!error && data && typeof data === 'object' && 'color' in data) {
              setUserColor(String(data.color))
            }
          } catch (error) {
            console.error('Error fetching user color:', error)
          }
        }
        
        // Call the function to fetch user color
        fetchUserColor()
      }
    }
    
    // Initial data load
    loadData()

    // Client-side only code
    if (typeof window !== 'undefined') {
      // Get stored name for event handlers
      const storedName = localStorage.getItem("userName")
      
      // Add event listener for color changes
      const handleColorChange = (event: StorageEvent) => {
        if (storedName && event.key?.startsWith("userColor_")) {
          const userName = event.key.replace("userColor_", "")
          if (userName === storedName && event.newValue) {
            setUserColor(event.newValue)
          }
        }
      }

      // Add event listener for custom color change events
      const handleCustomColorChange = (event: CustomEvent) => {
        if (storedName && event.detail.userName === storedName) {
          setUserColor(event.detail.color)
        }
      }

      // Listen for storage events (when localStorage changes)
      window.addEventListener("storage", handleColorChange)

      // Listen for our custom event
      window.addEventListener("userColorChange", handleCustomColorChange as EventListener)

      return () => {
        window.removeEventListener("storage", handleColorChange)
        window.removeEventListener("userColorChange", handleCustomColorChange as EventListener)
      }
    }
    
    // Return empty cleanup function for server-side rendering
    return () => {}
  }, [])

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
    
    // Check if we're entering a new week (based on Sunday)
    const currentSunday = new Date(currentWeek)
    currentSunday.setDate(currentWeek.getDate() - currentWeek.getDay()) // Get the Sunday of current week
    
    const nextSunday = new Date(nextWeek)
    nextSunday.setDate(nextWeek.getDate() - nextWeek.getDay()) // Get the Sunday of next week
    
    // If the Sunday dates are different, we're entering a new week
    if (nextSunday.getTime() !== currentSunday.getTime()) {
      // Clear schedules for the new week
      clearSchedulesForNewWeek()
      
      // Show a toast message encouraging users to add new schedules with an option to repeat previous week
      toast({
        title: "New week, fresh start! 🎉",
        description: "Time to plan your schedule for the week ahead. Click any time slot to add your activities!",
        variant: "default",
        duration: 8000,
        action: (
          <ToastAction altText="Repeat previous week" onClick={repeatPreviousWeek}>
            Repeat previous week
          </ToastAction>
        ),
      })
    }
    
    setCurrentWeek(nextWeek)
  }

  // Function to repeat the previous week's schedule
  const repeatPreviousWeek = async () => {
    try {
      // Store the previous week's schedules before clearing
      // Use a deep clone with explicit empty object fallback to avoid TypeScript error
      const previousWeekSchedules = structuredClone(schedules || {}) as SchedulesType
      
      // Clear the schedules first
      await clearSchedulesForNewWeek(false) // Pass false to not show toast again
      
      // Create a copy of the schedules (which are now cleared)
      const updatedSchedules = { ...schedules } as SchedulesType
      
      // Copy previous week's schedules to the new week
      for (const userId in previousWeekSchedules) {
        if (previousWeekSchedules.hasOwnProperty(userId)) {
          const userIdNum = parseInt(userId)
          
          // Copy schedules for each day
          DAYS_OF_WEEK.forEach((day: DayName) => {
            if (previousWeekSchedules[userIdNum] && previousWeekSchedules[userIdNum][day]) {
              // Create new array with new IDs for each time block
              updatedSchedules[userIdNum][day] = previousWeekSchedules[userIdNum][day].map((block: TimeBlock) => {
                // Generate a temporary ID
                const tempId = `temp-${Math.random().toString(36).substring(2, 11)}`
                
                return {
                  ...block,
                  id: tempId // Use a new temporary ID
                }
              })
              
              // Add to Supabase if it's the current user
              if (userName === users.find(u => u.id === userIdNum)?.name) {
                // Add each block to Supabase
                updatedSchedules[userIdNum][day].forEach(async (block: TimeBlock) => {
                  const { data: insertedData, error } = await getSupabase()
                    .from('schedules')
                    .insert({
                      user_id: userIdNum,
                      day: day,
                      start_time: block.start,
                      end_time: block.end,
                      label: block.label,
                      all_day: block.allDay || false
                    })
                    .select()
                  
                  if (error) {
                    console.error('Error adding repeated schedule to Supabase:', error)
                  } else if (insertedData && insertedData.length > 0) {
                    // Update the ID with the one from Supabase
                    const newId = insertedData[0].id as string
                    const blockIndex = updatedSchedules[userIdNum][day].findIndex(b => b.id === block.id)
                    if (blockIndex !== -1) {
                      updatedSchedules[userIdNum][day][blockIndex].id = newId
                    }
                  }
                })
              }
            }
          })
        }
      }
      
      // Update local state
      setSchedules(updatedSchedules)
      
      // Save to localStorage as a fallback
      localStorage.setItem('roommate-schedules', JSON.stringify(updatedSchedules))
      
      // Show success toast
      toast({
        title: "Schedule repeated! 🔄",
        description: "Your previous week's schedule has been copied to this week.",
        variant: "default",
        duration: 3000,
      })
      
    } catch (error) {
      console.error('Error repeating previous week\'s schedule:', error)
      
      // Show error toast
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't repeat your previous schedule. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Function to clear schedules for the new week
  const clearSchedulesForNewWeek = async (showToast = true) => {
    try {
      // Create a copy of the current schedules
      const updatedSchedules = { ...schedules } as SchedulesType
      
      // Clear schedules for each user
      for (const userId in updatedSchedules) {
        if (updatedSchedules.hasOwnProperty(userId)) {
          const userIdNum = parseInt(userId)
          
          // Clear schedules for each day
          DAYS_OF_WEEK.forEach((day: DayName) => {
            if (updatedSchedules[userIdNum] && updatedSchedules[userIdNum][day]) {
              updatedSchedules[userIdNum][day] = []
            }
          })
          
          // Update in Supabase
          if (userName === users.find(u => u.id === userIdNum)?.name) {
            // Only clear schedules in Supabase for the current user
            const { error } = await getSupabase()
              .from('schedules')
              .delete()
              .eq('user_id', userIdNum)
            
            if (error) {
              console.error('Error clearing schedules in Supabase:', error)
            }
          }
        }
      }
      
      // Update local state
      setSchedules(updatedSchedules)
      
      // Save to localStorage as a fallback
      localStorage.setItem('roommate-schedules', JSON.stringify(updatedSchedules))
      
    } catch (error) {
      console.error('Error clearing schedules for new week:', error)
    }
  }
  
  // Function to handle color updates from the WeeklySchedule component
  const handleColorUpdate = async (name: string, color: string) => {
    // Always update userColor if it's the current user
    if (name === userName) {
      setUserColor(color)
      
      // Client-side only code
      if (typeof window !== 'undefined') {
        // Also update localStorage for backup
        localStorage.setItem(`userColor_${name}`, color)
        
        // Dispatch a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("userColorChange", {
            detail: { userName: name, color },
          })
        )
      }
    }

    // Update only the color in the users array without affecting schedules
    setUsers((prev) => prev.map((user) => (user.name === name ? { ...user, color } : user)))
    
    // Update color in Supabase
    const userToUpdate = users.find(user => user.name === name)
    if (userToUpdate) {
      const { error } = await getSupabase()
        .from('users')
        .update({ color })
        .eq('id', userToUpdate.id)
      
      if (error) {
        console.error('Error updating user color in Supabase:', error)
      } else {
        console.log(`Successfully updated color for ${name} to ${color}`)
      }
    }
  }

  // Always return dark text for colored backgrounds
  const getTextColor = (bgColor: string) => {
    return "#000" // Always use dark text against colored backgrounds
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Main header - fixed at the top */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#242424] shadow-md border-b border-[#333333]" data-component-name="Dashboard">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-[57px] px-4 w-full">
          {/* Update the header title with home icon */}
          <div className="flex items-center gap-2">
            <img 
              src="/icons/small-icon.png?v=2"
              alt="Roomeez Icon" 
              width="18" 
              height="18" 
              className="w-[18px] h-[18px]"
              data-component-name="Dashboard"
            />
            <h1 
              className="text-2xl caveat-bold" 
              style={{ fontFamily: 'var(--font-caveat), cursive' }}
              data-component-name="Dashboard"
            >
              Roomeez
            </h1>
          </div>

          {/* Add a link to the overview page in the header section */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#A0A0A0] mr-2">Hi, {userName || "Friend"}</span>
            <div id="weekly-schedule-controls" className="hidden md:flex items-center mr-4">
              {/* This div will be used by the WeeklySchedule component */}
            </div>
            <Link href="/roommates">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Users className="h-4 w-4" />
                <span className="sr-only">Roommates</span>
              </Button>
            </Link>
            <Link href="/overview">
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  className="h-4 w-4"
                >
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="15" y1="3" x2="15" y2="21"></line>
                  <line x1="3" y1="3" x2="3" y2="21"></line>
                </svg>
                <span className="sr-only">Overview</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      {/* Spacer to account for fixed header */}
      <div className="h-[57px]"></div>
      <main className="flex-1 px-4 pb-20 pt-10 max-w-7xl mx-auto w-full relative" data-component-name="Dashboard">
        {/* Schedule content */}
        <div className="flex flex-col">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-[#A0A0A0]">Loading schedules...</p>
            </div>
          ) : (
            <WeeklySchedule 
              users={users} 
              currentWeek={currentWeek} 
              onColorChange={handleColorUpdate} 
              schedules={schedules}
              useAlternatingBg={false}
              onTimeFormatChange={setUse24HourFormat}
            />
          )}
        </div>
      </main>

      {/* Floating action button - only visible when logged in */}
      {userName && (
        <div 
          className="fixed bottom-6 right-6 z-[9999] transition-all duration-200 ease-in-out overflow-visible"
          data-component-name="LinkComponent"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
          }}
        >
          <Button
            asChild
            className="rounded-full min-h-[3.5rem] min-w-[3.5rem] p-3 border-2"
            style={{
              backgroundColor: userColor,
              color: getTextColor(userColor),
              borderColor: "rgba(0, 0, 0, 0.75)"
            }}
          >
            <Link href="/schedule/edit?from=%2Fdashboard" data-component-name="LinkComponent">
              <Edit2 className="h-6 w-6" />
              <span className="sr-only">Edit schedule</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}