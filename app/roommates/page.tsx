"use client"
import Link from "next/link"
import { ArrowLeft, Share2, Copy, Check, Edit2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { QRCodeSVG } from "qrcode.react"
import { usePathname } from "next/navigation"

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

  // Effect to get the current URL
  useEffect(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      // Get the base URL (protocol + host)
      const baseUrl = window.location.origin
      setCurrentUrl(baseUrl)
    }
  }, [])

  // Function to determine if a user has any schedules on a specific day
  // and check if they have an all-day off schedule
  const checkDayScheduleStatus = (userId: number, schedules: any, dayIndex: number) => {
    // Convert day index (0-6, Monday-Sunday) to day name
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayName = dayNames[dayIndex];
    
    // Check if user has any schedules for this day
    const hasSchedules = schedules[userId] && 
                        schedules[userId][dayName] && 
                        schedules[userId][dayName].length > 0;
    
    // Check if any of the schedules are all-day off
    let isAllDayOff = false;
    if (hasSchedules) {
      isAllDayOff = schedules[userId][dayName].some((schedule: Schedule) => 
        schedule.allDay === true && schedule.label.toLowerCase().includes('off')
      );
    }
    
    return { hasSchedules, isAllDayOff };
  };
  
  // Function to generate availability description based on schedules
  const generateAvailabilityDescription = (userId: number, schedules: Record<number, Record<string, Array<Schedule>>>) => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const availableDays: string[] = [];
    const unavailableDays: string[] = [];
    const allDayOffDays: string[] = [];
    
    dayNames.forEach((day, index) => {
      const { hasSchedules, isAllDayOff } = checkDayScheduleStatus(userId, schedules, index);
      
      if (isAllDayOff) {
        allDayOffDays.push(day);
        unavailableDays.push(day);
      } else if (hasSchedules) {
        availableDays.push(day);
      } else {
        unavailableDays.push(day);
      }
    });
    
    if (availableDays.length === 7) {
      return "Available all week";
    } else if (availableDays.length === 0) {
      return "No schedule set";
    } else if (availableDays.length > unavailableDays.length) {
      return `Available: ${formatDaysList(availableDays)}, Off: ${formatDaysList(unavailableDays)}`;
    } else {
      return `Off: ${formatDaysList(unavailableDays)}, Available: ${formatDaysList(availableDays)}`;
    }
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
    const fetchUsersAndSchedules = async () => {
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
        
        // Fetch all schedules
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('schedules')
          .select('*');
          
        if (schedulesError) {
          console.error('Error fetching schedules:', schedulesError);
          // If we can't get schedules, at least show the users
          if (usersData && usersData.length > 0) {
            setRoommates(usersData.map(user => ({
              ...user,
              description: "Unable to load schedule data",
              availableDays: []
            })));
          } else {
            setRoommates(initialUsers);
          }
          setLoading(false);
          return;
        }
        
        // Make sure we have valid data
        const validSchedulesData = schedulesData || [];
        
        // Process schedules into the format we need
        const processedSchedules: Record<number, Record<string, Array<any>>> = {};
        
        validSchedulesData.forEach(schedule => {
          if (!processedSchedules[schedule.user_id]) {
            processedSchedules[schedule.user_id] = {};
          }
          
          if (!processedSchedules[schedule.user_id][schedule.day]) {
            processedSchedules[schedule.user_id][schedule.day] = [];
          }
          
          processedSchedules[schedule.user_id][schedule.day].push({
            id: schedule.id,
            start: schedule.start_time,
            end: schedule.end_time,
            label: schedule.label,
            allDay: schedule.all_day
          });
        });
        
        // Map users with their availability based on actual schedules
        if (usersData && usersData.length > 0) {
          const mappedUsers = usersData.map(user => {
            // Calculate available days based on schedules
            const availableDays: number[] = [];
            const allDayOffDays: number[] = [];
            
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((day, index) => {
              const { hasSchedules, isAllDayOff } = checkDayScheduleStatus(user.id, processedSchedules, index);
              
              // If it's an all-day off schedule, don't mark as available
              if (hasSchedules && !isAllDayOff) {
                availableDays.push(index);
              }
              
              if (isAllDayOff) {
                allDayOffDays.push(index);
              }
            });
            
            return {
              ...user,
              description: generateAvailabilityDescription(user.id, processedSchedules),
              availableDays: availableDays,
              allDayOffDays: allDayOffDays
            };
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
    };

    fetchUsersAndSchedules();

    // Set up real-time subscription
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        fetchUsersAndSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersSubscription);
    };
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Header - fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#242424] p-4 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center justify-between w-full relative">
            <Link 
              href="/dashboard" 
              className="flex items-center text-white hover:opacity-80 z-10"
              data-component-name="LinkComponent"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-6 w-6" />
              <span className="sr-only">Back</span>
            </Link>
            <h1 className="text-xl font-bold absolute left-1/2 transform -translate-x-1/2" data-component-name="Roommates">Roommates</h1>
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
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium"
                    style={{ backgroundColor: roommate.color, color: "#000" }}
                  >
                    {roommate.initial}
                  </div>
                  <CardTitle>{roommate.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#A0A0A0]">{roommate.description}</p>

                <div className="mt-4">
                  <h4 className="text-xs font-medium text-[#A0A0A0] mb-2">DAYS OFF</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                      // Check if this day is marked as all-day off
                      const isAllDayOff = roommate.allDayOffDays && roommate.allDayOffDays.includes(index);
                      // Check if this day has any schedules
                      const hasSchedules = roommate.availableDays && roommate.availableDays.includes(index);
                      
                      // Determine background color and status text
                      let bgColor = '#333333'; // Default gray background
                      let statusText = 'No schedule';
                      
                      if (isAllDayOff) {
                        bgColor = '#FF5252'; // Red for all-day off
                        statusText = 'All day off';
                      } else if (hasSchedules) {
                        // Convert the hex color to rgba with 50% opacity
                        const hexColor = roommate.color.replace('#', '');
                        const r = parseInt(hexColor.substring(0, 2), 16);
                        const g = parseInt(hexColor.substring(2, 4), 16);
                        const b = parseInt(hexColor.substring(4, 6), 16);
                        bgColor = `rgba(${r}, ${g}, ${b}, 0.5)`; // Use roommate's color at 50% opacity
                        statusText = 'Scheduled';
                      }
                      
                      return (
                        <div key={index} className="text-center">
                          <div className="text-xs mb-1 text-white">{day}</div>
                          <div 
                            className="h-2 rounded-full" 
                            style={{ backgroundColor: bgColor }}
                            title={`${statusText} on ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}`}
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
                  <Link href={`/schedule/view/${roommate.id}`}>View Schedule</Link>
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