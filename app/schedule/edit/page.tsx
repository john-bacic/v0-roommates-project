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

interface ScheduleState {
  activeDay: string;
  Monday: TimeBlock[];
  Tuesday: TimeBlock[];
  Wednesday: TimeBlock[];
  Thursday: TimeBlock[];
  Friday: TimeBlock[];
  Saturday: TimeBlock[];
  Sunday: TimeBlock[];
  [key: string]: any; // For dynamic access
}

// Update the component to include userColor state
export default function EditSchedule() {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const [userColor, setUserColor] = useState("#FF7DB1"); // Default color
  const [use24HourFormat, setUse24HourFormat] = useState(false); // Default to false for server rendering
  const [returnPath, setReturnPath] = useState("/dashboard"); // Default to dashboard
  const router = useRouter();
  
  // Initialize schedule state with proper typing
  const [schedule, setSchedule] = useState<ScheduleState>({
    activeDay: "Monday",
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  
  // Set up initial state after component mounts
  useEffect(() => {
    setMounted(true);
    
    // Initialize time format preference from localStorage
    const savedFormat = localStorage.getItem('use24HourFormat');
    if (savedFormat !== null) {
      setUse24HourFormat(savedFormat === 'true');
    }
    
    // Get the user's name from localStorage or URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const storedName = localStorage.getItem("userName");
    
    // Get the day parameter and update active day if needed
    const dayParam = urlParams.get('day');
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const activeDay = dayParam && validDays.includes(dayParam) ? dayParam : "Monday";
    
    // Update the active day in state
    setSchedule(prev => ({
      ...prev,
      activeDay
    }));
    
    // Get the return path from URL if available
    const from = urlParams.get('from');
    if (from) {
      setReturnPath(decodeURIComponent(from));
    }
    
    // Prioritize the user parameter from URL if available
    const userToLoad = userParam || storedName;
    if (userToLoad) {
      // Check if the name is one of the roommates
      if (["Riko", "Narumi", "John"].includes(userToLoad)) {
        setUserName(userToLoad);
        loadUserData(userToLoad);
      } else {
        // If not a roommate, redirect to home page
        router.push("/");
      }
    } else {
      // If no name is set, redirect to home page
      router.push("/");
    }
  }, [router]);

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
      
      // Get the day parameter from URL to ensure we maintain the selected day
      const urlParams = new URLSearchParams(window.location.search);
      const dayParam = urlParams.get('day');
      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const activeDay = dayParam && validDays.includes(dayParam) ? dayParam : schedule.activeDay;
      
      // Update the active day in state if it's different from URL
      if (activeDay !== schedule.activeDay) {
        setSchedule(prev => ({
          ...prev,
          activeDay
        }));
      }
      
      // Transform schedules data to the format needed by the editor
      const formattedSchedule: {activeDay: string, [key: string]: any} = {
        activeDay: activeDay, // Use the day from URL parameter or keep current
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      };
      
      if (schedulesData && schedulesData.length > 0) {
        schedulesData.forEach((item: { day: string; id: string; start_time: string; end_time: string; label: string; all_day: boolean }) => {
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
      setSchedule(prev => ({
        ...prev,
        ...formattedSchedule,
        activeDay: formattedSchedule.activeDay || prev.activeDay,
        Monday: formattedSchedule.Monday || [],
        Tuesday: formattedSchedule.Tuesday || [],
        Wednesday: formattedSchedule.Wednesday || [],
        Thursday: formattedSchedule.Thursday || [],
        Friday: formattedSchedule.Friday || [],
        Saturday: formattedSchedule.Saturday || [],
        Sunday: formattedSchedule.Sunday || []
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Set up polling mechanism instead of Realtime subscriptions
  useEffect(() => {
    if (!userName) return;
    
    console.log('Setting up polling for EditSchedule component');
    
    // Initial data load
    loadUserData(userName);
    
    // Set up polling interval (every 30 seconds)
    const pollingInterval = setInterval(() => {
      console.log('Polling for schedule updates...');
      loadUserData(userName);
    }, 30000); // 30 seconds
    
    // Clean up interval on unmount
    return () => {
      console.log('Cleaning up polling interval');
      clearInterval(pollingInterval);
    };
  }, [userName]);

  // Effect for initialization and routing - runs only on client-side
  useEffect(() => {
    // Initialize time format preference from localStorage
    const savedFormat = localStorage.getItem('use24HourFormat')
    if (savedFormat !== null) {
      setUse24HourFormat(savedFormat === 'true')
    }
    
    // Get the user's name from localStorage or URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const userParam = urlParams.get('user')
    const storedName = localStorage.getItem("userName")
    
    // Get the day parameter and update active day if needed
    const dayParam = urlParams.get('day')
    if (dayParam && 
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(dayParam)) {
      // Update the active day based on URL parameter
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

  // Handle saving schedules
  const handleSave = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        return;
      }
      
      // Get the user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      const userId = userData.id;
      
      // Delete all existing schedules for this user
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Error deleting existing schedules:', deleteError);
        return;
      }
      
      // Prepare schedules for insertion
      const schedulesToInsert: Array<{
        user_id: string;
        day: string;
        start_time: string;
        end_time: string;
        label: string;
        all_day: boolean;
      }> = [];
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (const day of days) {
        if (schedule[day] && Array.isArray(schedule[day])) {
          for (const block of schedule[day]) {
            if (block && typeof block === 'object') {
              schedulesToInsert.push({
                user_id: userId,
                day: day,
                start_time: block.start || '',
                end_time: block.end || '',
                label: block.label || '',
                all_day: Boolean(block.allDay)
              });
            }
          }
        }
      }
      
      if (schedulesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('schedules')
          .insert(schedulesToInsert);
          
        if (insertError) {
          throw insertError;
        }
      }
      
      // Save to localStorage as a fallback
      if (userName) {
        localStorage.setItem(`schedule_${userName}`, JSON.stringify(schedule));
      }
      
      // Dispatch a custom event to notify components that we're returning to the view
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
    setSchedule(prev => ({
      ...prev,
      ...newSchedule,
      activeDay: newSchedule.activeDay || prev.activeDay,
      Monday: newSchedule.Monday || prev.Monday || [],
      Tuesday: newSchedule.Tuesday || prev.Tuesday || [],
      Wednesday: newSchedule.Wednesday || prev.Wednesday || [],
      Thursday: newSchedule.Thursday || prev.Thursday || [],
      Friday: newSchedule.Friday || prev.Friday || [],
      Saturday: newSchedule.Saturday || prev.Saturday || [],
      Sunday: newSchedule.Sunday || prev.Sunday || []
    }));
  }

  // Get current week date range and day numbers
  const getWeekDates = () => {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentDate = today.getDate()
    
    // Calculate the date for each day of the week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days.map((_, index) => {
      const diff = index - currentDay
      const date = new Date(today)
      date.setDate(currentDate + diff)
      return date.getDate()
    })
  }
  
  const dayNumbers = getWeekDates()
  
  // Get the current day name
  const getCurrentDay = () => {
    const now = new Date()
    const hours = now.getHours()
    
    // If it's before 6am, consider it the previous day
    let adjustedDate = new Date(now)
    if (hours < 6) {
      adjustedDate.setDate(now.getDate() - 1)
    }
    
    const dayIndex = adjustedDate.getDay() // 0 = Sunday, 1 = Monday, ...
    
    // Convert to our day format
    const dayMap = [
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ]
    
    return dayMap[dayIndex]
  }
  
  const currentDayName = getCurrentDay()

return (
  <div className="flex flex-col min-h-screen bg-[#282828] text-white">
    {/* Header - Fixed to top */}
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#242424] p-4 pb-0 shadow-md" data-component-name="EditSchedule">
      <div className="flex flex-col max-w-7xl mx-auto w-full" data-component-name="EditSchedule">
        <div className="flex items-center justify-between w-full mb-3" data-component-name="EditSchedule">
          <div className="flex items-center group w-[72px]">
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
          </div>
          <h1 className="text-xl font-bold absolute left-1/2 transform -translate-x-1/2" data-component-name="EditSchedule">
            Edit
          </h1>
          {/* Spacer element to balance layout with ml-auto */}
          <div className="w-8 h-8 ml-auto" aria-hidden="true"></div>
        </div>
        
        {/* Day selector tabs moved to header */}
        <div className="flex w-full" role="tablist" aria-label="Day selector" data-component-name="EditSchedule">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, dayIndex) => {
            const isActive = schedule.activeDay === day;
            return (
              <button
                key={day}
                onClick={() => {
                  const newSchedule = { ...schedule, activeDay: day };
                  setSchedule(newSchedule);
                }}
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
              >
                <div className="w-full flex flex-col md:flex-row items-center justify-center h-full md:space-x-1">
                  <span className={`${day === currentDayName ? 'text-red-500 font-bold' : ''} leading-none`}>
                    <span className="md:hidden">{day.substring(0, 1)}</span>
                    <span className="hidden md:inline">{day.substring(0, 3)}</span>
                  </span>
                  <span className={`${day === currentDayName ? 'text-red-500 font-bold' : 'text-inherit'} text-xs leading-none`}>
                    {dayNumbers[dayIndex]}
                  </span>
                </div>
                {isActive && (
                  <span 
                    className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-sm ${day === currentDayName ? 'bg-red-500' : ''}`}
                    style={day !== currentDayName ? { backgroundColor: userColor } : {}}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>

      {/* Main content - Added top padding to account for fixed header with tabs */}
      <main className="flex-1 p-4 pt-28 max-w-7xl mx-auto w-full">

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
