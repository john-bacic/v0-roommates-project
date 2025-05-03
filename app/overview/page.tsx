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
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [userName, setUserName] = useState("")
  const [userColor, setUserColor] = useState("#FF7DB1") // Default color
  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem('use24HourFormat')
      return savedFormat === 'true'
    }
    return false // Default to 12-hour format
  })
  
  // Helper function to get current day of the week
  const getCurrentDay = (): string => {
    const dayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
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
  
  // Load data on component mount
  useEffect(() => {
    loadData()
    
    // Set up real-time subscriptions
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      }, () => {
        loadData()
      })
      .subscribe()
    
    const scheduleSubscription = supabase
      .channel('schedules-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'schedules' 
      }, () => {
        loadData()
      })
      .subscribe()
    
    // Clean up subscriptions on unmount
    return () => {
      supabase.removeChannel(scheduleSubscription)
      supabase.removeChannel(usersSubscription)
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#242424] px-4 py-2 shadow-md" data-component-name="Overview">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center justify-between w-full">
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
            <h1 className="text-xl font-bold text-center w-full absolute left-0 right-0 pointer-events-none z-0" data-component-name="Overview">
              Daily
            </h1>
            <div className="w-[72px] flex justify-end">
              {/* Time format toggle button */}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8"
                onClick={() => {
                  const newFormat = !use24HourFormat
                  setUse24HourFormat(newFormat)
                  localStorage.setItem('use24HourFormat', newFormat.toString())
                }}
                title={`Switch to ${use24HourFormat ? '12-hour' : '24-hour'} format`}
                data-component-name="Overview"
              >
                <Clock className="h-5 w-5" />
                <span className="sr-only">
                  {use24HourFormat ? '24h' : '12h'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - add padding to account for fixed header */}
      <main className="flex-1 pt-[45px] md:px-4 px-0 pb-4 max-w-7xl mx-auto w-full">
        {/* Day selector tabs - fixed below header */}
        <div className="fixed top-[41px] left-0 right-0 z-40 bg-[#282828] border-b border-[#333333] shadow-sm opacity-90" data-component-name="Overview">
          <div className="grid grid-cols-7 gap-1 mb-1 pt-2 pb-1 px-2 w-full" role="tablist" aria-label="Day selector">
            {days.map((day) => {
              const isActive = selectedDay === day;
              const dayIndex = days.indexOf(day);
              const prevDay = dayIndex > 0 ? days[dayIndex - 1] : days[days.length - 1];
              const nextDay = dayIndex < days.length - 1 ? days[dayIndex + 1] : days[0];
              
              return (
                <Button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-8 py-1 px-1 sm:px-2 text-xs ${isActive 
                    ? 'bg-primary hover:bg-primary/90' 
                    : 'border bg-[#333333] border-[#444444] text-white hover:bg-[#444444]'}`}
                  style={isActive ? { 
                    backgroundColor: userColor,
                    color: "#000"
                  } : {}}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      selectDay(prevDay);
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      selectDay(nextDay);
                    }
                  }}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${day.toLowerCase()}-panel`}
                  tabIndex={0}
                  aria-label={`${day} tab${isActive ? ', selected' : ''}`}
                >
                  {day.substring(0, 3)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Add extra padding to account for fixed day selector tabs - reduced for mobile */}
        <div className="bg-[#282828] rounded-lg md:p-4 p-2 mt-[56px]">
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
                // Navigate to edit schedule for this day
                window.location.href = `/schedule/edit?day=${day}&from=%2Foverview`;
              }}
              onAddClick={(user, day) => {
                // Navigate to edit schedule for this day
                window.location.href = `/schedule/edit?day=${day}&from=%2Foverview`;
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
            <Link href="/schedule/edit?from=%2Foverview">
              <Edit2 className="h-6 w-6" />
              <span className="sr-only">Edit schedule</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
