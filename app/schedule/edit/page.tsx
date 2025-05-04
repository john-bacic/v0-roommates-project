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
  // Using a combined state object that includes activeDay
  const [schedule, setSchedule] = useState<{activeDay: string, [key: string]: any}>({  
    activeDay: "Monday", // Default active day
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  })

  // Function to load user data and schedules from Supabase
  const loadUserData = async (name: string) => {
    try {
      // Get user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      // Set user color
      setUserColor(userData.color);
      
      // Get schedules for this user
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userData.id);
      
      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError);
        return;
      }
      
      // Transform schedules data to the format needed by the editor
      const formattedSchedule: {activeDay: string, [key: string]: any} = {
        activeDay: schedule.activeDay, // Keep the current active day
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
      
      // Set the formatted schedule
      setSchedule(formattedSchedule);
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
  const [returnPath, setReturnPath] = useState("/dashboard") // Default to dashboard

  // Effect for initialization and routing
  useEffect(() => {
    // Get the user's name from localStorage or URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const userParam = urlParams.get('user')
    const storedName = localStorage.getItem("userName")
    
    // Get the day parameter from URL if available
    const dayParam = urlParams.get('day')
    if (dayParam && ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(dayParam)) {
      // Update the schedule with the new active day
      setSchedule(prev => ({ ...prev, activeDay: dayParam }))
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
      
      // Delete existing schedules for this user
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Error deleting schedules:', deleteError);
      }
      
      // Insert new schedules
      interface ScheduleRecord {
        user_id: number;
        day: string;
        start_time: string;
        end_time: string;
        label: string;
        all_day: boolean;
      }
      
      const schedulesToInsert: ScheduleRecord[] = [];
      
      // Loop through each day and create records for each time block
      for (const day in schedule) {
        // Skip the activeDay property
        if (day === 'activeDay') continue;
        
        if (Array.isArray(schedule[day])) {
          schedule[day].forEach((block: TimeBlock) => {
            schedulesToInsert.push({
              user_id: userId,
              day,
              start_time: block.start,
              end_time: block.end,
              label: block.label,
              all_day: block.allDay || false,
            });
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
      
      // Dispatch a custom event to notify components that we're returning to the view
      // This will trigger a data refresh in the Overview page
      const returnEvent = new CustomEvent('returnToScheduleView', {
        detail: { updatedAt: new Date().toISOString() }
      });
      document.dispatchEvent(returnEvent);
      
      // Navigate back to the page that triggered the edit
      router.push(returnPath);
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  }

  const handleScheduleChange = (newSchedule: {activeDay: string, [key: string]: any}) => {
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
      {/* Header - Fixed to top */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#242424] p-4 pb-3 shadow-md" data-component-name="EditSchedule">
        <div className="flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between w-full mb-3">
            <button 
              onClick={(e) => {
                e.preventDefault();
                
                // Use a more direct approach to ensure dashboard refreshes
                // Set a flag that will be checked by the dashboard
                sessionStorage.setItem('dashboardNeedsRefresh', 'true');
                
                // Store timestamp to ensure we can detect this is a new refresh request
                sessionStorage.setItem('refreshTimestamp', Date.now().toString());
                
                // Dispatch events for any components that might be listening
                document.dispatchEvent(new CustomEvent('returnToScheduleView', {
                  detail: { updatedAt: new Date().toISOString() }
                }));
                
                document.dispatchEvent(new CustomEvent('refreshTimeDisplays'));
                
                // Navigate to dashboard with a forced reload to ensure fresh data
                if (returnPath.includes('dashboard')) {
                  // If returning to dashboard, force a complete page reload
                  window.location.href = '/dashboard?refresh=' + Date.now();
                } else {
                  // For other pages, try history navigation first
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    window.location.href = returnPath;
                  }
                }
              }} 
              className="flex items-center text-white hover:opacity-80 cursor-pointer"
              data-component-name="BackButton"
              title="Back"
            >
              <ArrowLeft className="h-6 w-6" />
              <span className="sr-only">Back</span>
            </button>
            <h1 className="text-xl font-bold absolute left-1/2 transform -translate-x-1/2">Edit</h1>
            <div className="w-16">{/* Spacer to balance layout */}</div>
          </div>
          
          {/* Day selector tabs moved to header */}
          <div className="grid grid-cols-7 gap-1 w-full" role="tablist" aria-label="Day selector" data-component-name="EditSchedule">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
              const isActive = schedule.activeDay === day;
              return (
                <Button
                  key={day}
                  variant={isActive ? "default" : "outline"}
                  className={`px-1 sm:px-2 text-xs sm:text-sm h-10 py-2 ${isActive ? "text-black" : "bg-[#333333] border-[#444444] text-white hover:bg-[#444444]"}`}
                  style={isActive ? { backgroundColor: userColor, color: userColor === "#FFFFFF" ? "#000000" : "#FFFFFF" } : {}}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${day.toLowerCase()}-panel`}
                  onClick={() => {
                    const newSchedule = { ...schedule, activeDay: day };
                    setSchedule(newSchedule);
                  }}
                  data-component-name="_c"
                >
                  {day.substring(0, 3)}
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content - Added top padding to account for fixed header with tabs */}
      <main className="flex-1 p-4 pt-32 max-w-7xl mx-auto w-full">

        <div className="bg-[#333333] rounded-lg p-4 mt-4" data-component-name="EditSchedule">
          <ScheduleEditor 
            schedule={schedule} 
            onChange={handleScheduleChange} 
            userColor={userColor} 
            onSave={handleSave} 
            use24HourFormat={use24HourFormat}
            userName={userName}
          />
        </div>
      </main>
    </div>
  )
}
