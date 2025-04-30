"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, ChevronUp, ChevronDown, Edit2, Plus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { supabase, fetchUserSchedule, User, TimeBlock as SupabaseTimeBlock } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function ViewSchedule() {
  const params = useParams()
  const router = useRouter()
  const [roommate, setRoommate] = useState<User | null>(null)
  const [schedule, setSchedule] = useState<Record<string, Array<SupabaseTimeBlock>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserName, setCurrentUserName] = useState("")
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentUserId, setCurrentUserId] = useState<number>(3) // Default to John (id: 3) as the signed-in user
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    // Only run in client-side
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem('use24HourFormat')
      return savedFormat !== null ? savedFormat === 'true' : false
    }
    return false
  })
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    // Load data from Supabase
    const loadData = async () => {
      try {
        setLoading(true)
        const numId = parseInt(params.id as string, 10)
        
        if (isNaN(numId)) {
          router.push("/dashboard")
          return
        }
        
        // Fetch user data
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', numId)
          .single()
          
        if (userData) {
          setRoommate(userData)
          
          // Get stored user name
          const storedName = localStorage.getItem("userName")
          if (storedName) {
            setCurrentUserName(storedName)
          }
          
          // Get schedule data
          const scheduleData = await fetchUserSchedule(numId)
          setSchedule(scheduleData)
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [params.id, router])

  // Effect for header visibility on scroll
  useEffect(() => {
    let lastScrollY = 0;
    let lastScrollTime = 0;
    const scrollThreshold = 10;
    const throttleTime = 100;
    
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < throttleTime) return;
      
      lastScrollTime = now;
      const currentScrollY = window.scrollY;
      
      // Always show header at the top of the page
      if (currentScrollY < 10) {
        setHeaderVisible(true);
      } 
      // Hide header when scrolling down significantly
      else if (currentScrollY > lastScrollY + scrollThreshold) {
        setHeaderVisible(false);
      } 
      // Show header when scrolling up significantly
      else if (currentScrollY < lastScrollY - scrollThreshold) {
        setHeaderVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#282828] text-white">
        Loading...
      </div>
    )
  }

  if (!roommate || !schedule) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#282828] text-white">
        No data found
      </div>
    )
  }

  // Check if the current user is viewing their own schedule
  const isCurrentUser = roommate.name === currentUserName

  // Time conversion helper
  const timeToPosition = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    const decimalHours = hours + (minutes / 60)
    // Use the same calculation as the WeeklySchedule component
    return ((decimalHours - 6) / 18) * 100
  }

  // Format time for display
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number)
    
    if (use24HourFormat) {
      // 24-hour format
      return time
    } else {
      // AM/PM format
      const period = hours >= 12 ? "PM" : "AM"
      const displayHours = hours % 12 === 0 ? 12 : hours % 12
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
    }
  }
  
  // Format hour based on selected format
  const formatHour = (hour: number): string => {
    if (use24HourFormat) {
      if (hour === 24) {
        return "00"
      }
      if (hour > 24) {
        return `${hour - 24}`
      }
      return `${hour}`
    } else {
      // AM/PM format
      if (hour === 0 || hour === 24) {
        return "12am"
      }
      if (hour === 12) {
        return "12pm"
      }
      if (hour > 12 && hour < 24) {
        return `${hour - 12}pm`
      }
      if (hour >= 24) {
        return `${hour - 24}am`
      }
      return `${hour}am`
    }
  }
  
  // Toggle time format
  const toggleTimeFormat = () => {
    const newFormat = !use24HourFormat
    setUse24HourFormat(newFormat)
    localStorage.setItem('use24HourFormat', newFormat.toString())
  }
  
  // Toggle collapsed view
  const toggleView = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('weeklyScheduleCollapsed', String(newState))
  }
  
  // Format week range with month names
  const formatWeekRange = (date: Date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)) // Start of week (Monday)

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // End of week (Sunday)

    // Format with month name
    const formatDate = (d: Date) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${monthNames[d.getMonth()]} ${d.getDate()}`
    }

    return `${formatDate(start)} - ${formatDate(end)}`
  }
  
  // Get current time position as a percentage
  const getCurrentTimePosition = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // Convert to decimal hours (e.g., 14:30 = 14.5)
    const decimalHours = hours + (minutes / 60)
    
    // Our visible range is 6am to midnight (18 hours)
    let position
    
    // Handle times after midnight (0-5am)
    if (hours < 6) {
      // For hours 0-5, show them at the end of the previous day (after hour 24)
      position = ((hours + 24 - 6) / 18) * 100
    } else {
      // For normal hours (6am-11pm)
      position = ((decimalHours - 6) / 18) * 100
    }
    
    return Math.min(Math.max(0, position), 100) // Clamp between 0-100%
  }
  
  // Helper function to check if the current day is in the visible week
  const getCurrentTimeDay = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ...
    const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1] // Convert to our days array index
    return dayName
  }
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const hours = Array.from({ length: 19 }, (_, i) => i + 6) // 6 to 24 (midnight)

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Main header - fixed at the top */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-[#242424] shadow-md border-b border-[#333333] transform-gpu"
        style={{ 
          backfaceVisibility: 'hidden'
        }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto h-[57px] px-4 w-full">
          <div className="flex items-center justify-between w-full">
            <Link 
              href="/roommates" 
              className="flex items-center text-white hover:opacity-80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <h1 className="text-xl font-bold text-center flex-1">
              {roommate?.name}'s Schedule {isCurrentUser ? "(You)" : ""}
            </h1>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{
                backgroundColor: roommate?.color,
                color: "#000", // Always use dark text on colored backgrounds, matching WeeklySchedule
              }}
            >
              {roommate?.initial}
            </div>
          </div>
        </div>
      </header>
      
      {/* Spacer to account for fixed header */}
      <div className="h-[57px] will-change-auto"></div>
      
      {/* Weekly Schedule header - sticky below main header */}
      <div 
        className="fixed top-[57px] left-0 right-0 z-40 bg-[#242424] border-b border-[#333333] w-full overflow-hidden shadow-md opacity-90 transform-gpu transition-transform duration-300"
        style={{ 
          backfaceVisibility: 'hidden',
          transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)'
        }}
        data-component-name="ViewSchedule"
      >
        <div className="flex justify-between items-center h-[36px] w-full max-w-7xl mx-auto px-4">
          <div>
            <h3 className="text-sm font-medium">Week of {formatWeekRange(currentWeek)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTimeFormat}
              className="h-8 w-8 text-white md:hover:bg-white md:hover:text-black"
              title={use24HourFormat ? "Switch to AM/PM format" : "Switch to 24-hour format"}
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleView}
              className="h-8 w-8 text-white md:hover:bg-white md:hover:text-black"
              title={isCollapsed ? "expand-all" : "collapse-all"}
            >
              {isCollapsed ? (
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
                >
                  <polyline points="6 9 12 15 18 9" />
                  <line x1="4" y1="19" x2="20" y2="19" />
                </svg>
              ) : (
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
                >
                  <line x1="4" y1="5" x2="20" y2="5" />
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 pb-4 pt-[57px] max-w-7xl mx-auto w-full relative transform-gpu">
        {days.map((day, dayIndex) => (
          <div key={day} className="mb-4">
            {/* Day header - stays sticky below the WeeklySchedule header */}
            <div 
              id={`day-header-${day}`}
              className="sticky top-[57px] z-30 bg-[#282828] cursor-pointer hover:bg-opacity-80 transform-gpu"
              data-component-name="ViewSchedule"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex justify-between items-center pr-2">
                <h4 className="text-sm font-medium pl-2 h-[36px] flex items-center">{day}</h4>
              </div>
            </div>

            {/* Scrollable container for both time header and content */}
            <div className="md:overflow-visible overflow-x-auto scrollbar-hide">
              <div className="min-w-[800px] md:min-w-0 pl-2">
                {/* Time header - add padding-top to prevent overlapping */}
                <div className="bg-[#282828] mb-2 pt-1 relative">
                  <div className="relative h-6 overflow-visible transform-gpu" style={{ backfaceVisibility: 'hidden' }}>
                    <div className="absolute inset-0 flex overflow-visible">
                      {/* Current time indicator - vertical line with hardware acceleration */}
                      {getCurrentTimeDay() === day && (
                        <div 
                          className="absolute w-[2px] bg-red-500 z-20 transform-gpu"
                          style={{ 
                            left: `${getCurrentTimePosition()}%`,
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden',
                            height: '200%',
                            pointerEvents: 'none'
                          }}
                          data-component-name="ViewSchedule"
                        >
                          <div 
                            className="absolute w-[10px] h-[10px] rounded-full bg-red-500 transform-gpu"
                            style={{
                              top: '-5px',
                              left: '-5px',
                              backfaceVisibility: 'hidden'
                            }}
                            data-component-name="ViewSchedule"
                          ></div>
                        </div>
                      )}
                      
                      {/* Time labels */}
                      
                      {hours.map((hour) => (
                        <div key={hour} className="flex-1 relative" data-component-name="ViewSchedule">
                          <div
                            className="absolute top-0 text-[10px] text-[#666666] whitespace-nowrap"
                            style={{ left: `${((hour - 6) / 18) * 100}%` }}
                            data-component-name="ViewSchedule"
                          >
                            {formatHour(hour)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schedule timeline */}
                <div 
                  className={`relative ${isCollapsed ? "h-2" : "h-10"} bg-[#373737] rounded-md overflow-hidden transition-all duration-200`}
                  data-component-name="ViewSchedule"
                >
                  {/* Vertical grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {hours.map((hour) => (
                      <div key={hour} className="flex-1 border-l border-[#191919] first:border-l-0 h-full" />
                    ))}
                  </div>


                  
                  {/* Schedule blocks for this day */}
                  {schedule && schedule[day]?.map((block, index) => {
                    let startPos, endPos, width;
                    
                    if (block.allDay) {
                      startPos = 0;
                      endPos = 100;
                      width = 100;
                    } else {
                      // Calculate the position and width of the time block
                      const startHour = parseInt(block.start.split(":")[0])
                      const startMinute = parseInt(block.start.split(":")[1])
                      const endHour = parseInt(block.end.split(":")[0])
                      const endMinute = parseInt(block.end.split(":")[1])
                      
                      // Use the same calculation as the WeeklySchedule component
                      const startDecimalHours = startHour + (startMinute / 60)
                      const endDecimalHours = endHour + (endMinute / 60)
                      
                      startPos = ((startDecimalHours - 6) / 18) * 100
                      endPos = ((endDecimalHours - 6) / 18) * 100
                      width = endPos - startPos
                    }

                    return (
                      <div
                        key={block.id || index}
                        className={`absolute ${isCollapsed ? "h-2" : "top-0 h-full"} rounded-md flex items-center justify-center transition-all duration-200 z-10 ${isCurrentUser ? "cursor-pointer hover:opacity-90" : ""}`}
                        onClick={isCurrentUser ? () => router.push(`/schedule/edit?from=${encodeURIComponent(`/schedule/view/${params.id}`)}&user=${encodeURIComponent(roommate?.name || '')}&day=${encodeURIComponent(day)}&block=${encodeURIComponent(block.id || '')}`) : undefined}
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                          backgroundColor: block.allDay ? 'transparent' : roommate?.color,
                          color: block.allDay ? roommate?.color : "#000", // Always use dark text on colored backgrounds, matching WeeklySchedule
                          top: isCollapsed ? "0" : undefined,
                          border: block.allDay ? `2px solid ${roommate?.color}` : 'none',
                          backgroundImage: block.allDay ? `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.3) 5px, rgba(0,0,0,0.3) 10px)` : 'none',
                        }}
                        title={`Edit: ${block.label}${block.allDay ? " (All Day)" : `: ${block.start} - ${block.end}`}`}
                      >
                        {!isCollapsed && width > 15 ? (
                          <div className="flex flex-row items-center justify-start w-full h-full pl-4">
                            <div className="flex flex-row items-center justify-start">
                              {!block.allDay ? (
                                <span className="text-xs opacity-80 mr-1 font-bold leading-tight">
                                  {formatTime(block.start)} - {formatTime(block.end)}
                                </span>
                              ) : null}
                              {!block.allDay && <span className="text-xs opacity-60 mr-1">|</span>}
                              <span className="text-xs font-bold leading-tight">
                                {block.label}
                                {block.allDay ? " (All Day)" : ""}
                                {isCurrentUser && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-3 w-3 opacity-70 ml-1 inline"
                                  >
                                    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                                  </svg>
                                )}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
        

        {/* Floating edit button - only visible for the signed-in user */}
        {isCurrentUser && (
          <Link
            href={`/schedule/edit?from=${encodeURIComponent(`/schedule/view/${params.id}`)}&user=${encodeURIComponent(roommate?.name || '')}&day=${encodeURIComponent(days[0])}`}
            className="fixed bottom-6 right-6 rounded-full h-14 w-14 flex items-center justify-center border-2 border-black/75"
            style={{ backgroundColor: roommate?.color || '#03DAC6', color: '#000', zIndex: 100 }}
            title="Edit schedule"
            data-component-name="LinkComponent"
          >
            <Edit2 className="h-6 w-6" />
            <span className="sr-only">Edit schedule</span>
          </Link>
        )}
      </main>

      {/* Add CSS to hide scrollbars */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  )
}
