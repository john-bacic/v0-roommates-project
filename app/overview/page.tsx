"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Edit2 } from "lucide-react"
import { MultiDayView } from "@/components/multi-day-view"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

// Initial users data as fallback
const initialUsers = [
  { id: 1, name: "Riko", color: "#BB86FC", initial: "R" },
  { id: 2, name: "Narumi", color: "#03DAC6", initial: "N" },
  { id: 3, name: "John", color: "#CF6679", initial: "J" },
]

// Helper function to determine text color based on background color
const getTextColor = (bgColor: string): string => {
  const lightColors = ["#BB86FC", "#03DAC6", "#FFB74D", "#64B5F6", "#81C784", "#FFD54F"]
  return lightColors.includes(bgColor) ? "#000" : "#fff"
}

export default function Overview() {
  // Initialize users state with the initial users data
  const [usersList, setUsersList] = useState<typeof initialUsers>(initialUsers)
  const [schedules, setSchedules] = useState<Record<number, Record<string, Array<{ start: string; end: string; label: string; allDay?: boolean }>>>>({})
  const [loading, setLoading] = useState(true)
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [userName, setUserName] = useState("")
  const [userColor, setUserColor] = useState("#BB86FC") // Default color
  
  // State for day-by-day view
  const [selectedDay, setSelectedDay] = useState<string | null>(null) // null means show all days
  const [showFullWeek, setShowFullWeek] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('overviewShowFullWeek')
      return savedView !== null ? savedView === 'true' : true
    }
    return true
  })

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

  // Set up real-time subscription to schedule changes
  useEffect(() => {
    const scheduleSubscription = supabase
      .channel('schedules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        // Reload data when any schedule changes
        loadData()
      })
      .subscribe()

    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        // Reload data when any user changes (like color updates)
        loadData()
      })
      .subscribe()

    // Initial data load
    loadData()

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
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${monthNames[d.getMonth()]} ${d.getDate()}`
    }

    return `${formatDate(start)} - ${formatDate(end)}`
  }

  // Toggle between full week and day-by-day view
  const toggleViewMode = () => {
    const newState = !showFullWeek
    setShowFullWeek(newState)
    localStorage.setItem('overviewShowFullWeek', newState.toString())
    
    // If switching to day view and no day is selected, select Monday
    if (!newState && !selectedDay) {
      setSelectedDay(days[0])
    }
  }
  
  // Select a specific day
  const selectDay = (day: string) => {
    setSelectedDay(day)
    setShowFullWeek(false)
    localStorage.setItem('overviewShowFullWeek', 'false')
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Header - now sticky */}
      <header className="sticky top-0 z-50 border-b border-[#333333] bg-[#282828] p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <div className="flex items-center group">
              <Link href="/dashboard" className="flex items-center text-[#A0A0A0] group-hover:text-white mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
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
                className="h-4 w-4 mx-2 text-[#A0A0A0] group-hover:text-white transition-colors duration-200"
              >
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </div>
            <h1 className="text-xl font-bold">
              {showFullWeek ? `Week of ${formatWeekRange(currentWeek)}` : (selectedDay || days[0])}
            </h1>
          </div>
          
          {/* View toggle button */}
          <Button 
            onClick={toggleViewMode} 
            variant="outline" 
            className="text-sm bg-transparent border-[#444444] hover:bg-[#444444] text-white"
          >
            {showFullWeek ? "Day View" : "Week View"}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-0 md:px-4 px-0 pb-4 max-w-7xl mx-auto w-full">
        {/* Day selector tabs - only visible in day view */}
        {!showFullWeek && (
          <div className="flex overflow-x-auto scrollbar-hide mb-4 mt-2 px-2">
            {days.map((day) => (
              <Button
                key={day}
                onClick={() => selectDay(day)}
                variant={selectedDay === day ? "default" : "outline"}
                className={`mr-2 whitespace-nowrap ${selectedDay === day 
                  ? '' 
                  : 'bg-transparent border-[#444444] text-white hover:bg-[#444444]'}`}
                style={selectedDay === day ? { 
                  backgroundColor: userColor, 
                  color: getTextColor(userColor),
                  borderColor: userColor 
                } : {}}
              >
                {day.substring(0, 3)}
              </Button>
            ))}
          </div>
        )}

        <div className="bg-[#282828] rounded-lg md:p-4 p-2">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-[#A0A0A0]">Loading schedules...</p>
            </div>
          ) : (
            <MultiDayView 
              users={usersList} 
              schedules={schedules} 
              days={showFullWeek ? days : [selectedDay || days[0]]} 
              useAlternatingBg={true} 
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
