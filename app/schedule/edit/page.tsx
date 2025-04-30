"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScheduleEditor } from "@/components/schedule-editor"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// Add the getTextColor helper function
const getTextColor = (bgColor: string) => {
  return "#000" // Always use dark text against colored backgrounds
}

interface TimeBlock {
  id?: string
  start: string
  end: string
  label: string
  allDay?: boolean
}

// Update the component to include userColor state
export default function EditSchedule() {
  const [userName, setUserName] = useState("")
  const [userColor, setUserColor] = useState("#FF7DB1") // Default color
  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem('use24HourFormat')
      return savedFormat !== null ? savedFormat === 'true' : false
    }
    return false
  })
  const router = useRouter()
  const [activeDay, setActiveDay] = useState("Monday") // Default active day
  const [schedule, setSchedule] = useState<Record<string, TimeBlock[]>>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  })

  // Function to load user data and schedules from Supabase
  const loadUserData = async (userName: string) => {
    try {
      // Get user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('name', userName)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      if (userData) {
        // Set user color from Supabase
        setUserColor(userData.color);
        
        // Get user schedules from Supabase
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .eq('user_id', userData.id);
        
        if (schedulesError) {
          console.error('Error fetching schedules:', schedulesError);
          return;
        }
        
        // Transform schedules data to the format needed by the editor
        const formattedSchedule: Record<string, TimeBlock[]> = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: [],
        };
        
        if (schedulesData && schedulesData.length > 0) {
          schedulesData.forEach(item => {
            if (!formattedSchedule[item.day]) {
              formattedSchedule[item.day] = [];
            }
            
            formattedSchedule[item.day].push({
              id: item.id,
              start: item.start_time,
              end: item.end_time,
              label: item.label,
              allDay: item.all_day
            });
          });
        }
        
        setSchedule(formattedSchedule);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Set up real-time subscription to schedule changes
  useEffect(() => {
    if (!userName) return;

    // Set up subscription for schedule changes
    const scheduleSubscription = supabase
      .channel('schedules-changes-edit')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        // Reload data when any schedule changes
        loadUserData(userName);
      })
      .subscribe();

    // Set up subscription for user changes (like color updates)
    const usersSubscription = supabase
      .channel('users-changes-edit')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        // Reload data when any user changes
        loadUserData(userName);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(scheduleSubscription);
      supabase.removeChannel(usersSubscription);
    };
  }, [userName]);

  // State to track the return path
  const [returnPath, setReturnPath] = useState("/dashboard")

  // Effect for initialization and routing
  useEffect(() => {
    // Get the user's name from localStorage or URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const userParam = urlParams.get('user')
    const storedName = localStorage.getItem("userName")
    
    // Get the day parameter from URL if available
    const dayParam = urlParams.get('day')
    if (dayParam && ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(dayParam)) {
      setActiveDay(dayParam)
    }
    
    // Get the return path from URL if available
    const from = urlParams.get('from')
    if (from) {
      setReturnPath(decodeURIComponent(from))
    }
    
    // Prioritize the user parameter from URL if available
    const userToLoad = userParam || storedName
    
    if (userToLoad) {
      // Check if the name is one of the roommates
      if (["Riko", "Narumi", "John"].includes(userToLoad)) {
        setUserName(userToLoad)
        
        // Load user data and schedules from Supabase
        loadUserData(userToLoad);
      } else {
        // If not a roommate, redirect to home page
        router.push("/")
      }
    } else {
      // If no name is set, redirect to home page
      router.push("/")
    }
  }, [router]);

  // Effect for color and time format changes
  useEffect(() => {
    const handleColorChange = (event: CustomEvent<{userName: string, color: string}>) => {
      if (event.detail.userName === userName) {
        setUserColor(event.detail.color)
      }
    }
    
    // Add listener for time format changes
    const handleTimeFormatChange = (event: CustomEvent<{use24Hour: boolean}>) => {
      setUse24HourFormat(event.detail.use24Hour)
    }
    
    window.addEventListener('userColorChange', handleColorChange as EventListener)
    window.addEventListener('timeFormatChange', handleTimeFormatChange as EventListener)
    
    return () => {
      window.removeEventListener('userColorChange', handleColorChange as EventListener)
      window.removeEventListener('timeFormatChange', handleTimeFormatChange as EventListener)
    }
  }, [userName])
  
  // Apply time format class to document
  useEffect(() => {
    // Apply a CSS class to the document to control time input display
    if (use24HourFormat) {
      document.documentElement.classList.add('use-24h-time')
    } else {
      document.documentElement.classList.remove('use-24h-time')
    }
  }, [use24HourFormat])

  const handleSave = async () => {
    if (!userName) return;
    
    try {
      // Get user ID from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('name', userName)
        .single();
      
      if (userError) {
        console.error('Error fetching user ID:', userError);
        return;
      }
      
      const userId = userData.id;
      
      // First, delete all existing schedules for this user to avoid duplicates
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Error deleting existing schedules:', deleteError);
      }
      
      // Prepare schedule data for insertion
      const schedulesToInsert = [];
      
      for (const [day, timeBlocks] of Object.entries(schedule)) {
        for (const block of timeBlocks) {
          schedulesToInsert.push({
            user_id: userId,
            day: day,
            start_time: block.start,
            end_time: block.end,
            label: block.label,
            all_day: block.allDay || false
          });
        }
      }
      
      // Insert all schedules at once
      if (schedulesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('schedules')
          .insert(schedulesToInsert);
        
        if (insertError) {
          console.error('Error inserting schedules:', insertError);
        }
      }
      
      // Save to localStorage as a fallback
      localStorage.setItem(`schedule_${userName}`, JSON.stringify(schedule));
      
      // Navigate back to the page that triggered the edit
      router.push(returnPath);
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  }

  const handleScheduleChange = (newSchedule: Record<string, TimeBlock[]>) => {
    setSchedule(newSchedule)
  }

  // Get current week date range
  const formatWeekRange = () => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // End of week (Saturday)

    // Format with month name
    const formatDate = (d: Date) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${monthNames[d.getMonth()]} ${d.getDate()}`
    }

    return `${formatDate(start)} - ${formatDate(end)}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#333333] bg-[#242424] p-4 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href={returnPath} className="flex items-center text-[#A0A0A0] hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <h1 className="text-xl font-bold absolute left-1/2 transform -translate-x-1/2">Edit</h1>
          <div className="w-16">{/* Spacer to balance layout */}</div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-lg font-medium">Week of {formatWeekRange()}</h2>
        </div>

        <div className="bg-[#333333] rounded-lg p-4">
          <ScheduleEditor 
            schedule={schedule} 
            onChange={handleScheduleChange} 
            userColor={userColor} 
            onSave={handleSave} 
            use24HourFormat={use24HourFormat}
            userName={userName}
            initialActiveDay={activeDay}
          />
        </div>
      </main>
    </div>
  )
}
