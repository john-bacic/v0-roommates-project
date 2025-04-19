"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Edit2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WeeklySchedule } from "@/components/weekly-schedule"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

// Initial users array
const initialUsers = [
  { id: 1, name: "Riko", color: "#BB86FC", initial: "R" },
  { id: 2, name: "Narumi", color: "#03DAC6", initial: "N" },
  { id: 3, name: "John", color: "#CF6679", initial: "J" },
]

export default function Dashboard() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [userName, setUserName] = useState("")
  const [users, setUsers] = useState(initialUsers)
  const [userColor, setUserColor] = useState("#BB86FC") // Default color
  const [schedules, setSchedules] = useState<Record<number, Record<string, any>>>({})
  const [loading, setLoading] = useState(true)

  // Function to load data from Supabase
  const loadData = async () => {
    setLoading(true)
    
    try {
      // Fetch users from Supabase
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        // Fall back to initial users if there's an error
        setUsers(initialUsers)
      } else if (usersData && usersData.length > 0) {
        setUsers(usersData)
        
        // Set current user's color if they exist in the users list
        if (userName) {
          const currentUser = usersData.find(u => u.name === userName)
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

  // Set up real-time subscriptions to schedule and user changes
  useEffect(() => {
    const scheduleSubscription = supabase
      .channel('schedules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        // Reload data when any schedule changes
        loadData()
      })
      .subscribe()
      
    // Subscribe to user changes to update colors in real-time
    const userSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload: any) => {
        // When a user record changes, check if it's the current user and update color if needed
        if (payload.new && typeof payload.new === 'object' && 'name' in payload.new && 'color' in payload.new) {
          // Check if this is the current user
          if (userName === payload.new.name) {
            setUserColor(payload.new.color)
          }
        }
        
        // Reload all user data to ensure everything is in sync
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(scheduleSubscription)
      supabase.removeChannel(userSubscription)
    }
  }, [userName])

  useEffect(() => {
    // Get the user's name from localStorage (we'll keep this for user preference)
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setUserName(storedName)
      
      // Immediately check for the user's color in Supabase
      const fetchUserColor = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('color')
            .eq('name', storedName)
            .single()
            
          if (!error && data) {
            setUserColor(data.color)
          }
        } catch (error) {
          console.error('Error fetching user color:', error)
        }
      }
      
      fetchUserColor()
    }
    
    // Initial data load
    loadData()

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
    setCurrentWeek(nextWeek)
  }

  // Function to handle color updates from the WeeklySchedule component
  const handleColorUpdate = async (name: string, color: string) => {
    // Always update userColor if it's the current user
    if (name === userName) {
      setUserColor(color)
      
      // Also update localStorage for backup
      localStorage.setItem(`userColor_${name}`, color)
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("userColorChange", {
          detail: { userName: name, color },
        })
      )
    }

    // Update only the color in the users array without affecting schedules
    setUsers((prev) => prev.map((user) => (user.name === name ? { ...user, color } : user)))
    
    // Update color in Supabase
    const userToUpdate = users.find(user => user.name === name)
    if (userToUpdate) {
      const { error } = await supabase
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

  // Determine text color based on background color
  const getTextColor = (bgColor: string) => {
    const lightColors = ["#BB86FC", "#03DAC6", "#FFB74D", "#64B5F6", "#81C784", "#FFD54F"]
    return lightColors.includes(bgColor) ? "#000" : "#fff"
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Main header - always fixed at the top with exact height */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#121212] shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-[57px] px-4">
          {/* Update the header title */}
          <h1 className="text-xl font-bold">Roommate Schedules</h1>

          {/* Add a link to the overview page in the header section */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#A0A0A0]">Hi, {userName || "Friend"}</span>
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

      {/* Add padding to account for the fixed header */}
      <main className="flex-1 pt-[57px] p-4 max-w-7xl mx-auto w-full">


        {/* Schedule content */}
        <div className="flex flex-col gap-4">
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
            />
          )}
        </div>
      </main>

      {/* Floating action button - only visible when logged in */}
      {userName && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            asChild
            className="rounded-full h-14 w-14"
            style={{
              backgroundColor: userColor,
              color: getTextColor(userColor),
            }}
          >
            <Link href="/schedule/edit?from=%2Fdashboard">
              <Edit2 className="h-6 w-6" />
              <span className="sr-only">Edit schedule</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}