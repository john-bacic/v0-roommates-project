"use client"
import Link from "next/link"
import { ArrowLeft, Share2, Copy, Check, Edit2, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useCallback } from "react"
import { supabase, fetchWeekSchedules } from "@/lib/supabase"
import { QRCodeSVG } from "qrcode.react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { formatWeekRange, isSameWeek, getWeekBounds, parseWeekParam } from "@/lib/date-utils"
import { useScheduleEvents, emitWeekChange } from "@/lib/schedule-events"

// Define interfaces for our data types
interface Schedule {
  id: string;
  start: string;
  end: string;
  label: string;
  allDay: boolean;
}

interface Roommate {
  id: number;
  name: string;
  color: string;
  initial: string;
  description: string;
  availableDays: number[];
  allDayOffDays?: number[];
}

// Initial users data as fallback
const initialUsers: Roommate[] = [
  {
    id: 1,
    name: "Riko",
    color: "#FF7DB1",
    initial: "R",
    description: "Available: Mon-Fri, Busy on weekends",
    availableDays: [0, 1, 2, 3, 4] // Monday to Friday
  },
  { 
    id: 2, 
    name: "Narumi", 
    color: "#63D7C6", 
    initial: "N", 
    description: "Available: Tue-Sat, Free on Sun-Mon",
    availableDays: [1, 2, 3, 4, 5] // Tuesday to Saturday
  },
  { 
    id: 3, 
    name: "John", 
    color: "#F8D667", 
    initial: "J", 
    description: "Available: Mon-Thu, Limited on Fri",
    availableDays: [0, 1, 2, 3] // Monday to Thursday
  },
]

export default function Roommates() {
  const [roommates, setRoommates] = useState<Roommate[]>(initialUsers)
  const [loading, setLoading] = useState(true)
  const [currentUrl, setCurrentUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [currentUser, setCurrentUser] = useState<number | null>(3) // Default to John (id: 3) as the signed-in user
  const pathname = usePathname()
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [userName, setUserName] = useState('')
  const [userColor, setUserColor] = useState('#B388F5') // Default color
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchUsersAndSchedules = useCallback(async () => {
      try {
        console.log('Starting to fetch users and schedules');
        setLoading(true);
        
        // Check if supabase client is initialized
        if (!supabase) {
          console.error('Supabase client is not initialized');
          setRoommates(initialUsers);
          setLoading(false);
          return;
        }
        
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');
          
        if (usersError) {
          console.error('Error fetching users:', usersError);
          // Fall back to initial users if there's an error
          setRoommates(initialUsers);
          setLoading(false);
          return;
        }
        
        // Load schedules for the selected week using week-aware function
        const weekSchedules = await fetchWeekSchedules(selectedWeek);
        
        // Convert week schedules to flat array format for processing
        const schedulesData: any[] = [];
        Object.entries(weekSchedules).forEach(([userId, userSchedule]) => {
          Object.entries(userSchedule).forEach(([day, blocks]) => {
            blocks.forEach(block => {
              schedulesData.push({
                id: block.id,
                user_id: parseInt(userId),
                day: day,
                start_time: block.start,
                end_time: block.end,
                label: block.label,
                all_day: block.allDay
              });
            });
          });
        });
        
        // Make sure we have valid data
        const validSchedulesData = schedulesData || [];
        
        // Process schedules into the format we need
        const processedSchedules: Record<number, Record<string, Array<any>>> = {};
        
        validSchedulesData.forEach((schedule: { user_id: number | string; day: string; id: string; start_time: string; end_time: string; label: string; all_day: boolean }) => {
          const userId = (schedule.user_id as number);
          const day = (schedule.day as string);
          const id = (schedule.id as string);
          const startTime = (schedule.start_time as string);
          const endTime = (schedule.end_time as string);
          const label = (schedule.label as string);
          const allDay = (schedule.all_day as boolean);
          
          if (!processedSchedules[userId]) {
            processedSchedules[userId] = {};
          }
          
          if (!processedSchedules[userId][day]) {
            processedSchedules[userId][day] = [];
          }
          
          processedSchedules[userId][day].push({
            id,
            start: startTime,
            end: endTime,
            label,
            allDay
          });
        });
        
        // Map users with their availability based on actual schedules
        if (usersData && usersData.length > 0) {
          const mappedUsers = usersData.map((user: { id: number | string; name?: string; color?: string; initial?: string }) => {
            // Calculate available days based on schedules
            const availableDays: number[] = [];
            const allDayOffDays: number[] = [];
            const userId = typeof user.id === 'number' ? user.id : parseInt(String(user.id));
            
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((day, index) => {
              // Convert user.id to number to ensure proper typing
              const { hasSchedules, isAllDayOff } = checkDayScheduleStatus(userId, processedSchedules, index);
              
              // If it's an all-day off schedule, don't mark as available
              if (hasSchedules && !isAllDayOff) {
                availableDays.push(index);
              }
              
              if (isAllDayOff) {
                allDayOffDays.push(index);
              }
            });
            
            // Create properly typed Roommate object
            return {
              id: userId,
              name: user.name as string,
              color: user.color as string,
              initial: (user.initial as string) || (user.name as string).charAt(0).toUpperCase(),
              description: generateAvailabilityDescription(userId, processedSchedules),
              availableDays: availableDays,
              allDayOffDays: allDayOffDays
            } as Roommate;
          });
          
          setRoommates(mappedUsers);
        }
      } catch (error) {
        console.error('Error in fetchUsersAndSchedules:', error);
        console.log('Error details:', JSON.stringify(error, null, 2));
        // Fall back to initial users if there's an error
        setRoommates(initialUsers);
      } finally {
        setLoading(false);
        console.log('Finished fetching users and schedules');
      }
  }, [selectedWeek]);

  // Effect to get the current URL and set up date-related state
  useEffect(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      // Get the base URL (protocol + host)
      const baseUrl = window.location.origin
      setCurrentUrl(baseUrl)
      
      // Set up current date information
      fetchUsersAndSchedules()
    }
  }, [fetchUsersAndSchedules])

  useEffect(() => {
    const weekParam = searchParams.get("week");
    if (weekParam) {
      const newWeek = parseWeekParam(weekParam);
      setSelectedWeek(newWeek);
      // Also emit week change event to sync other components
      emitWeekChange(newWeek, 'roommates');
    }
  }, [searchParams]);

  // Function to determine if a user has any schedules on a specific day
  // and check if they have an all-day off schedule
  const checkDayScheduleStatus = (userId: number, schedules: any, dayIndex: number) => {
    // Convert day index (0-6, Sunday-Saturday) to day name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayIndex];
    
    // Check if user has any schedules for this day
    const hasSchedules = schedules[userId] && 
                        schedules[userId][dayName] && 
                        schedules[userId][dayName].length > 0;
    
    // Check if any of the schedules are all-day (any kind)
    let isAllDayOff = false;
    if (hasSchedules) {
      isAllDayOff = schedules[userId][dayName].some((schedule: Schedule) => 
        schedule.allDay === true
      );
    }
    
    return { hasSchedules, isAllDayOff };
  };
  
  
  // Function to generate availability description based on schedules
  const generateAvailabilityDescription = (userId: number, schedules: Record<number, Record<string, Array<Schedule>>>) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const workingDays: string[] = [];
    const offDays: string[] = [];
    const allDayOffDays: string[] = [];
    const noScheduleDays: string[] = [];
    
    // First, analyze each day's schedule
    dayNames.forEach((day, index) => {
      const { hasSchedules, isAllDayOff } = checkDayScheduleStatus(userId, schedules, index);
      
      if (isAllDayOff) {
        // Day is marked as all day off
        allDayOffDays.push(day);
        offDays.push(day);
      } else if (hasSchedules) {
        // Day has work schedules
        workingDays.push(day);
      } else {
        // No schedule set for this day
        noScheduleDays.push(day);
      }
    });
    
    // Generate the description based on the schedule analysis
    if (workingDays.length === 0 && offDays.length === 0) {
      return "No schedule set";
    }
    
    // Build a more descriptive message
    const parts = [];
    
    if (workingDays.length > 0) {
      parts.push(`Working: ${formatDaysList(workingDays)}`);
    }
    
    if (allDayOffDays.length > 0) {
      parts.push(`Day off: ${formatDaysList(allDayOffDays)}`);
    }
    
    if (noScheduleDays.length > 0 && (workingDays.length > 0 || allDayOffDays.length > 0)) {
      parts.push(`No schedule: ${formatDaysList(noScheduleDays)}`);
    }
    
    return parts.join(' • ');
  };
  
  // Helper function to format a list of days nicely
  const formatDaysList = (days: string[]) => {
    if (days.length === 0) return "None";
    if (days.length === 1) return days[0].substring(0, 3);
    if (days.length === 2) return `${days[0].substring(0, 3)}, ${days[1].substring(0, 3)}`;
    
    // Check for consecutive days to use ranges
    const dayIndices = days.map(day => [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ].indexOf(day));
    dayIndices.sort((a, b) => a - b);
    
    // Check if days are consecutive
    let isConsecutive = true;
    for (let i = 1; i < dayIndices.length; i++) {
      if (dayIndices[i] !== dayIndices[i-1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    
    if (isConsecutive) {
      return `${days[0].substring(0, 3)}-${days[days.length-1].substring(0, 3)}`;
    } else {
      return days.map(day => day.substring(0, 3)).join(', ');
    }
  };


  useEffect(() => {
    // Get current user info
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
      // Fetch user color
      supabase
        .from('users')
        .select('color')
        .eq('name', storedName)
        .single()
        .then(({ data, error }: { data: any; error: any }) => {
          if (!error && data) {
            setUserColor(data.color);
          }
        });
    }
    
    fetchUsersAndSchedules();

    // Visibility-based refresh disabled for better performance
    // console.log('Setting up visibility-based refresh for Roommates component');
    
    // Handle page visibility changes (when user returns to the tab)
    // const handleVisibilityChange = () => {
    //   if (document.visibilityState === 'visible') {
    //     console.log('Tab became visible - refreshing roommates data');
    //     fetchUsersAndSchedules();
    //   }
    // };
    
    // // Add event listener
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // return () => {
    //   console.log('Cleaning up visibility listener in Roommates');
    //   document.removeEventListener('visibilitychange', handleVisibilityChange);
    // };
  }, [selectedWeek, fetchUsersAndSchedules])

  // Set up event listeners for schedule synchronization
  useEffect(() => {
    const events = useScheduleEvents()
    
    // Listen for week changes from other components
    const unsubscribeWeek = events.on('week-changed', (event) => {
      console.log('[Roommates] Week change event received:', event.detail)
      if (event.detail.source !== 'roommates' && event.detail.weekDate) {
        setSelectedWeek(event.detail.weekDate)
      }
    })
    
    // Listen for sync requests
    const unsubscribeSync = events.on('sync-required', () => {
      console.log('[Roommates] Sync request received')
      fetchUsersAndSchedules()
    })
    
    return () => {
      unsubscribeWeek()
      unsubscribeSync()
    }
  }, [fetchUsersAndSchedules])

  const setWeekAndUrl = (date: Date) => {
    setSelectedWeek(date);
    const weekStr = date.toISOString().split('T')[0];
    router.replace(`?week=${weekStr}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Header - fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#242424] p-4 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center justify-between w-full relative">
            <Link 
              href={{ pathname: "/dashboard", query: { week: selectedWeek.toISOString().split('T')[0] } }}
              className="flex items-center text-white hover:opacity-80 z-10"
              data-component-name="LinkComponent"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-6 w-6" />
              <span className="sr-only">Back</span>
            </Link>
            <div className="flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-black/10"
                onClick={() => {
                  const prevWeek = new Date(selectedWeek)
                  prevWeek.setDate(selectedWeek.getDate() - 7)
                  setWeekAndUrl(prevWeek)
                  emitWeekChange(prevWeek, 'roommates')
                }}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4 text-[#A0A0A0]" />
                <span className="sr-only">Previous week</span>
              </Button>
              <h1 
                className={`text-sm font-medium mx-2 ${isSameWeek(selectedWeek, new Date()) ? '' : 'text-[#A0A0A0]'}`} 
                style={isSameWeek(selectedWeek, new Date()) ? { color: userColor } : {}}
                data-component-name="Roommates"
              >
                {formatWeekRange(selectedWeek)}
              </h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-black/10"
                onClick={() => {
                  const nextWeek = new Date(selectedWeek)
                  nextWeek.setDate(selectedWeek.getDate() + 7)
                  setWeekAndUrl(nextWeek)
                  emitWeekChange(nextWeek, 'roommates')
                }}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4 text-[#A0A0A0]" />
                <span className="sr-only">Next week</span>
              </Button>
            </div>
            <div className="w-6"></div> {/* Spacer to balance the back button */}
          </div>
        </div>
      </header>
      {/* Spacer to account for fixed header */}
      <div className="h-[73px]"></div>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roommates.map((roommate) => (
            <Card key={roommate.id} className="bg-[#333333] border-[#333333]">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium"
                  style={{ 
                    backgroundColor: roommate.color,
                    color: '#000000'
                  }}
                  data-component-name="Roommates"
                >
                  {roommate.initial}
                </div>
                <CardTitle>{roommate.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#A0A0A0]">{roommate.description}</p>

                <div className="mt-4">
                  <h4 className="text-xs font-medium text-[#A0A0A0] mb-2">DAYS OFF</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }, (_, i) => {
                      // Calculate the date for this day of the selected week (starting from Sunday)
                      const weekStart = new Date(selectedWeek);
                      weekStart.setDate(selectedWeek.getDate() - selectedWeek.getDay());
                      const date = new Date(weekStart);
                      date.setDate(weekStart.getDate() + i);
                      
                      // Get the day of the month
                      const dayOfMonth = date.getDate();
                      // Get the day abbreviation
                      const dayAbbr = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i];
                      // Get the full day name
                      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i];
                      
                      // Check if this day is marked as all-day off
                      const isAllDayOff = roommate.allDayOffDays && roommate.allDayOffDays.includes(i);
                      // Check if this day has any schedules
                      const hasSchedules = roommate.availableDays && roommate.availableDays.includes(i);
                      
                      // Determine background color and status text
                      let bgColor = '#333333'; // Default gray background
                      let statusText = 'No schedule';
                      
                      if (isAllDayOff) {
                        // Use red for all-day events
                        bgColor = '#FF5252'; // Red for all-day events
                        statusText = 'All day';
                      } else if (hasSchedules) {
                        // Use the user's color at 50% opacity for regular schedules
                        const hexColor = roommate.color.replace('#', '');
                        const r = parseInt(hexColor.substring(0, 2), 16);
                        const g = parseInt(hexColor.substring(2, 4), 16);
                        const b = parseInt(hexColor.substring(4, 6), 16);
                        bgColor = `rgba(${r}, ${g}, ${b}, 0.5)`; // Use roommate's color at 50% opacity
                        statusText = 'Scheduled';
                      }
                      
                      return (
                        <div key={i} className="text-center">
                          <div className="text-xs mb-1 text-white">
                            <div>{dayAbbr}</div>
                            <div className="text-[10px] opacity-80">{dayOfMonth}</div>
                          </div>
                          <div 
                            className="h-2 rounded-full" 
                            style={{ backgroundColor: bgColor }}
                            title={`${statusText} on ${dayName} (${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()})`}
                            data-component-name="Roommates"
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                


                <Button
                  asChild
                  className="w-full mt-4"
                  style={{
                    backgroundColor: roommate.color,
                    color: "#000", // Always use dark text against colored backgrounds
                    border: "none"
                  }}
                >
                  <Link
                    href={{
                      pathname: `/schedule/view/${roommate.id}`,
                      query: { week: getWeekBounds(selectedWeek).startStr }
                    }}
                    data-component-name="LinkComponent"
                  >
                    View Schedule
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* QR Code Section */}
        <div className="mt-12 mb-8 flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-lg mb-4">
            <QRCodeSVG 
              value={currentUrl || "https://v0-minimal-web-app-design.vercel.app"} 
              size={200} 
              bgColor="#FFFFFF" 
              fgColor="#000000" 
              level="H" 
              includeMargin={false}
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2 flex items-center justify-center">
              <Share2 className="h-5 w-5 mr-2" />
              Share This App
            </h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative flex items-center max-w-md w-full">
                <input 
                  type="text" 
                  readOnly 
                  value={currentUrl || "https://v0-minimal-web-app-design.vercel.app"}
                  className="w-full bg-[#333333] border border-[#444444] rounded-md py-2 px-3 pr-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#63D7C6]"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl || "https://v0-minimal-web-app-design.vercel.app")
                      .then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      })
                  }}
                  className="absolute right-2 p-1 rounded-md hover:bg-[#444444] transition-colors"
                  aria-label="Copy URL"
                >
                  {copied ? 
                    <Check className="h-4 w-4 text-green-500" /> : 
                    <Copy className="h-4 w-4 text-[#A0A0A0]" />}
                </button>
              </div>
            </div>
            <p className="text-[#A0A0A0] text-sm max-w-md mx-auto">
              Scan this QR code or copy the URL to access the Roomies Schedule app on any device.
              Share with your roommates to coordinate schedules easily!
            </p>
          </div>
        </div>

      </main>
    </div>
  )
} 