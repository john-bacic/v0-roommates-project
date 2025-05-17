"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Edit2, Clock } from "lucide-react"
import { SingleDayView } from "@/components/single-day-view"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

// Initial users data as fallback
const initialUsers = [
  { id: 1, name: "Riko", color: "#FF7DB1", initial: "R" },
  { id: 2, name: "Narumi", color: "#63D7C6", initial: "N" },
  { id: 3, name: "John", color: "#F8D667", initial: "J" },
]

// Helper function to always return dark text for colored backgrounds
const getTextColor = (bgColor: string): string => {
  return "#000" // Always use dark text against colored backgrounds
}

export default function Overview() {
  // Initialize users state with the initial users data
  const [usersList, setUsersList] = useState<typeof initialUsers>(initialUsers)
  const [schedules, setSchedules] = useState<Record<number, Record<string, Array<{ start: string; end: string; label: string; allDay?: boolean }>>>>({})
  const [loading, setLoading] = useState(true)
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  
  // Get the current date and calculate dates for each day of the week
  const getWeekDates = () => {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentDate = today.getDate()
    
    // Calculate the date for each day of the week
    return days.map((_, index) => {
      const diff = index - currentDay
      const date = new Date(today)
      date.setDate(currentDate + diff)
      return date.getDate()
    })
  }
  
  const dayNumbers = getWeekDates()
  const [userName, setUserName] = useState("")
  const [userColor, setUserColor] = useState("#FF7DB1") // Default color
  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem('use24HourFormat')
      return savedFormat === 'true'
    }
    return false // Default to 12-hour format
  })
  
  // Helper function to get logical day of the week
  // Hours between midnight and 6am are considered part of the previous day
  const getCurrentDay = (): string => {
    const now = new Date();
    const hours = now.getHours();
    
    // If it's before 6am, consider it the previous day
    let adjustedDate = new Date(now);
    if (hours < 6) {
      adjustedDate.setDate(now.getDate() - 1);
    }
    
    const dayIndex = adjustedDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    // Convert to our day format (we use Monday as first day)
    const dayMap = {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday"
    };
    
    return dayMap[dayIndex as keyof typeof dayMap];
  }
  
  // Get the current day name
  const currentDayName = getCurrentDay();
  
  // State for day view
  const [selectedDay, setSelectedDay] = useState<string>(getCurrentDay())

  // Function to load data from Supabase
  const loadData = async () => {
    setLoading(true)
    
    try {
      // Get the user's name from localStorage
      const storedName = localStorage.getItem("userName")
      if (storedName) {
        setUserName(storedName)
        
        // Immediately fetch the user's color
        const { data, error } = await supabase
          .from('users')
          .select('color')
          .eq('name', storedName)
          .single()
        
        if (!error && data && typeof data === 'object' && 'color' in data) {
          setUserColor(String(data.color))
        }
      }
      
      // Fetch users from Supabase
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        // Fall back to initial users if there's an error
        setUsersList(initialUsers)
      } else if (usersData && usersData.length > 0) {
        setUsersList(usersData)
        
        // Set current user's color if they exist in the users list
        if (storedName) {
          const currentUser = usersData.find(u => u.name === storedName)
          if (currentUser) {
            setUserColor(currentUser.color)
          }
        }
        
        // Fetch schedules for each user
        const schedulesData: Record<number, Record<string, Array<any>>> = {}
        
        for (const user of usersData) {
          const { data: userSchedules, error: schedulesError } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', user.id)
          
          if (!schedulesError && userSchedules) {
            // Transform the data into the format expected by the app
            const formattedSchedules: Record<string, Array<any>> = {}
            
            userSchedules.forEach(schedule => {
              if (!formattedSchedules[schedule.day]) {
                formattedSchedules[schedule.day] = []
              }
              
              formattedSchedules[schedule.day].push({
                id: schedule.id,
                start: schedule.start_time,
                end: schedule.end_time,
                label: schedule.label,
                allDay: schedule.all_day
              })
            })
            
            schedulesData[user.id] = formattedSchedules
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
  
  // Function to refresh all time displays
  const refreshTimeDisplays = () => {
    console.log('Refreshing time displays');
    // Force a complete data reload
    loadData();
  }
  
  // Load data on component mount
  useEffect(() => {
    // Load initial data
    loadData()
    
    // Check if we should refresh the page (coming back from edit page)
    const shouldRefresh = sessionStorage.getItem('refreshAfterNavigation') === 'true';
    if (shouldRefresh) {
      // Clear the flag
      sessionStorage.removeItem('refreshAfterNavigation');
      // Force a refresh of the page
      window.location.reload();
      return;
    }
    
    // Add listener for the refresh event
    const handleRefreshEvent = () => refreshTimeDisplays();
    document.addEventListener('refreshTimeDisplays', handleRefreshEvent);
    
    // Check URL parameters for refresh request
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh') === 'true') {
      // Remove the parameter from URL without refreshing
      const newUrl = window.location.pathname + 
                    (window.location.search ? 
                      window.location.search.replace(/[?&]refresh=true/, '') : '');
      window.history.replaceState({}, document.title, newUrl);
      
      // Refresh the time displays
      refreshTimeDisplays();
    }
    
    // Set up subscription for schedule changes
    const scheduleSubscription = supabase
      .channel('schedules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        // Reload data when any schedule changes
        loadData()
      })
      .subscribe()
    
    // Set up subscription for user changes
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        // Reload data when any user changes
        loadData()
      })
      .subscribe()
    
    // Listen for custom scheduleDataUpdated events from SingleDayView component
    const handleScheduleUpdate = (event: Event) => {
      console.log('Schedule update event received, reloading data')
      // Check if the event has updated schedule data
      const customEvent = event as CustomEvent
      if (customEvent.detail && customEvent.detail.updatedSchedules) {
        // Use the updated schedules directly
        setSchedules(customEvent.detail.updatedSchedules)
      } else {
        // Fall back to reloading all data
        loadData()
      }
    }
    
    // Handle page visibility changes (when user returns to the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing Overview data')
        loadData()
      }
    }
    
    // Handle navigation events (when user navigates back to this page)
    const handleNavigation = () => {
      console.log('Navigation detected, refreshing Overview data')
      loadData()
    }
    
    // Listen for custom event from edit page
    const handleReturnToView = () => {
      console.log('Returned from edit page, refreshing Overview data')
      loadData()
    }
    
    // Add event listeners
    document.addEventListener('scheduleDataUpdated', handleScheduleUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('popstate', handleNavigation)
    window.addEventListener('focus', handleNavigation)
    document.addEventListener('returnToScheduleView', handleReturnToView)
    
    // Clean up subscriptions and event listeners on unmount
    return () => {
      supabase.removeChannel(scheduleSubscription)
      supabase.removeChannel(usersSubscription)
      document.removeEventListener('scheduleDataUpdated', handleScheduleUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('refreshTimeDisplays', handleRefreshEvent)
      window.removeEventListener('popstate', handleNavigation)
      window.removeEventListener('focus', handleNavigation)
      document.removeEventListener('returnToScheduleView', handleReturnToView)
    }
  }, [])

  // Format week range with month names
  const formatWeekRange = (date: Date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // End of week (Saturday)

    // Format with month name
    const formatDate = (d: Date) => {
      const monthName = d.toLocaleString('default', { month: 'short' })
      return `${monthName} ${d.getDate()}`
    }

    return `${formatDate(start)} - ${formatDate(end)}`
  }
  
  // Navigate to the previous day
  const goToPreviousDay = () => {
    const currentIndex = days.indexOf(selectedDay);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : days.length - 1;
    selectDay(days[prevIndex]);
  };
  
  // Navigate to the next day
  const goToNextDay = () => {
    const currentIndex = days.indexOf(selectedDay);
    const nextIndex = currentIndex < days.length - 1 ? currentIndex + 1 : 0;
    selectDay(days[nextIndex]);
  };
  
  // Function to select a specific day
  const selectDay = (day: string) => {
    setSelectedDay(day)
  }
  
  // Add keyboard navigation for days
  useEffect(() => {
    // Apply keyboard navigation for day view
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input elements are focused
      if (document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        if (e.key === 'ArrowLeft') {
          goToPreviousDay();
        } else if (e.key === 'ArrowRight') {
          goToNextDay();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDay]);

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Header - fixed at the top */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#242424] p-4 pb-0 shadow-md" data-component-name="Overview">
        <div className="flex flex-col max-w-7xl mx-auto w-full" data-component-name="Overview">
          <div className="flex items-center justify-between w-full mb-3" data-component-name="Overview">
            <div className="flex items-center group w-[72px]">
              <Link 
                href="/dashboard" 
                className="flex items-center text-white hover:opacity-80"
                data-component-name="LinkComponent"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-6 w-6" />
                <span className="sr-only">Back</span>
              </Link>
            </div>
            <h1 className="text-xl font-bold absolute left-1/2 transform -translate-x-1/2" data-component-name="Overview">
              Days
            </h1>
            {/* Time format toggle button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 ml-auto"
              onClick={() => {
                const newFormat = !use24HourFormat
                setUse24HourFormat(newFormat)
                localStorage.setItem('use24HourFormat', newFormat.toString())
              }}
              title={`Switch to ${use24HourFormat ? '12-hour' : '24-hour'} format`}
              data-component-name="_c"
            >
              <Clock className="h-5 w-5" />
              <span className="sr-only">
                {use24HourFormat ? '24h' : '12h'}
              </span>
            </Button>
          </div>
          
          {/* Day selector tabs moved to header */}
          <div className="flex w-full" role="tablist" aria-label="Day selector" data-component-name="Overview">
            {days.map((day) => {
              const isActive = selectedDay === day;
              const dayIndex = days.indexOf(day);
              const prevDay = dayIndex > 0 ? days[dayIndex - 1] : days[days.length - 1];
              const nextDay = dayIndex < days.length - 1 ? days[dayIndex + 1] : days[0];
              
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`relative flex-1 h-10 px-1 text-xs font-medium transition-all focus:outline-none touch-none select-none ${isActive 
                    ? 'text-white' 
                    : 'text-[#999999] hover:text-white'}`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    ...(isActive ? { color: userColor } : {})
                  }}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${day.toLowerCase()}-panel`}
                  tabIndex={0}
                  aria-label={`${day} tab${isActive ? ', selected' : ''}`}
                  data-component-name="_c"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      selectDay(prevDay)
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault()
                      selectDay(nextDay)
                    }
                  }}
                >
                  <div className="w-full flex flex-col md:flex-row items-center justify-center h-full md:space-x-1">
                    <span className={`${day === currentDayName ? 'text-red-500 font-bold' : ''} leading-none`}>
                      <span className="md:hidden">{day.substring(0, 1)}</span>
                      <span className="hidden md:inline">{day.substring(0, 3)}</span>
                    </span>
                    <span className={`${day === currentDayName ? 'text-red-500 font-bold' : 'text-inherit'} text-xs leading-none`}>
                      {dayNumbers[days.indexOf(day)]}
                    </span>
                  </div>
                  {isActive && (
                    <span 
                      className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-sm ${day === currentDayName ? 'bg-red-500' : ''}`}
                      style={day !== currentDayName ? { backgroundColor: userColor } : {}}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main content - add padding to account for fixed header with tabs */}
      <main className="flex-1 p-4 pt-28 max-w-7xl mx-auto w-full">
        {/* Content container */}
        <div className="bg-[#282828] rounded-lg md:p-4 p-2">
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <p className="text-[#A0A0A0]">Loading schedules...</p>
            </div>
          ) : (
            <SingleDayView
              users={usersList}
              schedules={schedules}
              day={selectedDay || days[0]}
              use24HourFormat={use24HourFormat}
              onBlockClick={(user, day, block) => {
                // Navigate to edit schedule for this day and user
                window.location.href = `/schedule/edit?day=${encodeURIComponent(day)}&user=${encodeURIComponent(user.name)}&from=%2Foverview`;
              }}
              onAddClick={(user, day) => {
                // Navigate to edit schedule for this day and user
                window.location.href = `/schedule/edit?day=${encodeURIComponent(day)}&user=${encodeURIComponent(user.name)}&from=%2Foverview`;
              }}
              currentUserName={userName}
              onTimeFormatChange={(use24Hour) => {
                setUse24HourFormat(use24Hour)
                localStorage.setItem('use24HourFormat', use24Hour.toString())
              }}
            />
          )}
        </div>
      </main>

      {/* Floating action button - only visible when logged in */}
      {userName && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            asChild
            className="rounded-full h-14 w-14 border-2"
            style={{
              backgroundColor: userColor,
              color: getTextColor(userColor),
              borderColor: "rgba(0, 0, 0, 0.75)"
            }}
          >
            <Link href={`/schedule/edit?day=${encodeURIComponent(selectedDay)}&from=%2Foverview`}>
              <Edit2 className="h-6 w-6" />
              <span className="sr-only">Edit schedule</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
