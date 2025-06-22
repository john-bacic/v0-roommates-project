"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Save, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScheduleEditor } from "@/components/schedule-editor"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase, fetchWeekSchedules } from "@/lib/supabase"
import { getWeekBounds, formatWeekRange, getCurrentDayName, getDateForDayInWeek, isSameWeek } from "@/lib/date-utils"
import { useScheduleEvents, emitWeekChange, emitScheduleUpdate } from "@/lib/schedule-events"

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

function EditSchedulePage() {
  const searchParams = useSearchParams()

  const weekParam = searchParams.get('week')
  const dayParam = searchParams.get('day')
  const fromParam = searchParams.get('from')
  const userParam = searchParams.get('user')

  // Parse date components manually to avoid timezone issues
  let initialWeek: Date;
  if (weekParam) {
    console.log(`[EditSchedulePage] Raw week param:`, weekParam);
    const [year, month, day] = weekParam.split('-').map(Number);
    initialWeek = new Date(year, month - 1, day); // month is 0-indexed
    console.log(`[EditSchedulePage] Parsed initial week:`, initialWeek.toISOString());
  } else {
    initialWeek = new Date();
    console.log(`[EditSchedulePage] No week param, using current date:`, initialWeek.toISOString());
  }

  return (
    <EditScheduleUI
      initialWeek={initialWeek}
      initialDay={dayParam}
      fromPath={fromParam}
      userNameFromUrl={userParam}
    />
  )
}

function EditScheduleUI({ initialWeek, initialDay, fromPath, userNameFromUrl }: {
  initialWeek: Date
  initialDay: string | null
  fromPath: string | null
  userNameFromUrl: string | null
}) {
  const [error, setError] = useState<Error | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userColor, setUserColor] = useState("#FF7DB1");
  const [use24HourFormat, setUse24HourFormat] = useState(false);
  const [returnPath, setReturnPath] = useState("/dashboard");
  
  // Always store the start of the week to ensure consistency
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => {
    console.log(`[EditScheduleUI] Received initialWeek:`, initialWeek.toISOString());
    const { start } = getWeekBounds(initialWeek);
    console.log(`[EditScheduleUI] Normalized to week start:`, start.toISOString());
    return start;
  });
  
  const router = useRouter();
  
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
  
  useEffect(() => {
    setMounted(true);
    
    const storedName = localStorage.getItem("userName");
    const userToLoad = userNameFromUrl || storedName;
    
    if (fromPath) setReturnPath(decodeURIComponent(fromPath));
    if (initialDay) setSchedule(prev => ({ ...prev, activeDay: initialDay }));

    if (userToLoad && ["Riko", "Narumi", "John"].includes(userToLoad)) {
      setUserName(userToLoad);
    } else {
      router.push("/");
    }
  }, []);

  useEffect(() => {
    if (userName && mounted) {
      loadUserData(userName, selectedWeek).catch(err => {
        console.error('Error loading user data:', err);
        setError(new Error('Failed to load user data. Please try refreshing the page.'));
      });
    }
  }, [userName, selectedWeek, mounted]);

  const loadUserData = async (name: string, weekDate: Date) => {
    try {
      if (!weekDate || isNaN(weekDate.getTime())) {
        console.warn('Invalid week date, using current date');
        weekDate = new Date();
      }
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      setUserColor(userData.color);
      setUserId(userData.id);
      
      console.log('[EditSchedule] Loading schedules for week:', formatWeekRange(weekDate));
      const weekSchedules = await fetchWeekSchedules(weekDate, userData.id);
      
      const userSchedules = weekSchedules[userData.id] || {};
      
      const dayParam = initialDay;
      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const activeDay = dayParam && validDays.includes(dayParam) ? dayParam : schedule.activeDay;
      
      if (activeDay !== schedule.activeDay) {
        setSchedule(prev => ({ ...prev, activeDay }));
      }
      
      const formattedSchedule: {activeDay: string, [key: string]: any} = {
        activeDay: activeDay,
        Monday: userSchedules.Monday || [],
        Tuesday: userSchedules.Tuesday || [],
        Wednesday: userSchedules.Wednesday || [],
        Thursday: userSchedules.Thursday || [],
        Friday: userSchedules.Friday || [],
        Saturday: userSchedules.Saturday || [],
        Sunday: userSchedules.Sunday || [],
      };
      
      setSchedule(prev => ({
        ...prev,
        ...formattedSchedule,
        activeDay: formattedSchedule.activeDay || prev.activeDay,
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    if (!userName || !mounted) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUserData(userName, selectedWeek);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userName, selectedWeek, mounted]);

  useEffect(() => {
    const handleColorChange = (event: CustomEvent<{userName: string, color: string}>) => {
      if (event.detail.userName === userName) {
        setUserColor(event.detail.color)
      }
    }
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
  
  useEffect(() => {
    document.documentElement.classList.toggle('use-24h-time', use24HourFormat)
  }, [use24HourFormat])
  
  useEffect(() => {
    const events = useScheduleEvents()
    const unsubscribeSync = events.on('sync-required', () => {
      loadUserData(userName, selectedWeek)
    })
    return () => {
      unsubscribeSync()
    }
  }, [userName, selectedWeek])



  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      if (userError) throw userError;
      
      const userId = userData.id;
      const weekToUse = selectedWeek && !isNaN(selectedWeek.getTime()) ? selectedWeek : new Date();
      
      // A more efficient way to delete and insert
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const datesForWeek = daysOfWeek.map((day) => getDateForDayInWeek(weekToUse, day));

      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('user_id', userId)
        .in('date', datesForWeek);

      if (deleteError) throw deleteError;
      
      const schedulesToInsert = daysOfWeek.flatMap(day => 
        (schedule[day] || []).map((block: TimeBlock) => ({
          user_id: userId,
          day: day,
          date: getDateForDayInWeek(weekToUse, day),
          start_time: block.start || '',
          end_time: block.end || '',
          label: block.label || '',
          all_day: Boolean(block.allDay)
        }))
      );
      
      if (schedulesToInsert.length > 0) {
        const { error: insertError } = await supabase.from('schedules').insert(schedulesToInsert);
        if (insertError) throw insertError;
      }
      
      if (userName) localStorage.setItem(`schedule_${userName}`, JSON.stringify(schedule));
      
      document.dispatchEvent(new CustomEvent('returnToScheduleView', {
        detail: { updatedAt: new Date().toISOString() }
      }));
      
      const weekString = `${weekToUse.getFullYear()}-${String(weekToUse.getMonth() + 1).padStart(2, '0')}-${String(weekToUse.getDate()).padStart(2, '0')}`;
      router.push(`${returnPath}?week=${weekString}`);
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  }

  const handleScheduleChange = (newSchedule: {activeDay: string, [key: string]: any}) => {
    setSchedule(prev => ({ ...prev, ...newSchedule }));
    if (userId) emitScheduleUpdate(userId, selectedWeek, newSchedule.activeDay || schedule.activeDay, 'edit');
  };

  const getWeekDates = (week: Date) => {
    // Use the already normalized week start
    const dates: number[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(week);
      date.setDate(week.getDate() + i);
      dates.push(date.getDate());
    }
    return dates;
  }
  
  const getCurrentDay = (week: Date) => {
    const now = new Date()
    let adjustedDate = new Date(now)
    if (now.getHours() < 6) adjustedDate.setDate(now.getDate() - 1)
    
    if (!isSameWeek(adjustedDate, week)) return null
    
    const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return dayMap[adjustedDate.getDay()]
  }
  
  const currentDayName = getCurrentDay(selectedWeek)

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#282828] text-white items-center justify-center p-4">
        <div className="bg-[#333333] rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold mb-4 text-red-500">Error</h2>
          <p className="mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#282828] text-white items-center justify-center">
        <p className="text-[#A0A0A0]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#242424] p-4 pb-0 shadow-md">
        <div className="flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center group w-[72px]">
              <Link 
                href={`${returnPath}?week=${selectedWeek.getFullYear()}-${String(selectedWeek.getMonth() + 1).padStart(2, '0')}-${String(selectedWeek.getDate()).padStart(2, '0')}`}
                className="flex items-center text-white hover:opacity-80 cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="h-6 w-6" />
                <span className="sr-only">Back</span>
              </Link>
            </div>
            <div className="flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-black/10"
                onClick={() => {
                  const prevWeek = new Date(selectedWeek);
                  prevWeek.setDate(selectedWeek.getDate() - 7);
                  const { start } = getWeekBounds(prevWeek);
                  setSelectedWeek(start);
                  emitWeekChange(start, 'edit');
                }}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4 text-[#A0A0A0]" />
              </Button>
              <h1 
                className={`text-sm font-medium mx-2 ${isSameWeek(selectedWeek, new Date()) ? '' : 'text-[#A0A0A0]'}`} 
                style={isSameWeek(selectedWeek, new Date()) ? { color: userColor } : {}}
              >
                {formatWeekRange(selectedWeek)}
              </h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-black/10"
                onClick={() => {
                  const nextWeek = new Date(selectedWeek);
                  nextWeek.setDate(selectedWeek.getDate() + 7);
                  const { start } = getWeekBounds(nextWeek);
                  setSelectedWeek(start);
                  emitWeekChange(start, 'edit');
                }}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4 text-[#A0A0A0]" />
              </Button>
            </div>
            <div className="w-8 h-8 ml-auto" aria-hidden="true"></div>
          </div>
          
          <div className="flex w-full" role="tablist" aria-label="Day selector">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, dayIndex) => {
              const isActive = schedule.activeDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSchedule(prev => ({ ...prev, activeDay: day }))}
                  className={`relative flex-1 h-10 px-1 text-xs font-medium transition-all focus:outline-none touch-none select-none ${isActive 
                    ? 'text-white' 
                    : 'text-[#999999] hover:text-white'}`}
                  style={{ WebkitTapHighlightColor: 'transparent', ...(isActive ? { color: userColor } : {}) }}
                  role="tab"
                  aria-selected={isActive}
                >
                  <div className="w-full flex flex-col md:flex-row items-center justify-center h-full md:space-x-1">
                    <span className={`${day === currentDayName ? 'text-red-500 font-bold' : ''} leading-none`}>
                      <span className="md:hidden">{day.substring(0, 1)}</span>
                      <span className="hidden md:inline">{day.substring(0, 3)}</span>
                    </span>
                    <span className={`${day === currentDayName ? 'text-red-500 font-bold' : 'text-inherit'} text-xs leading-none`}>
                      {getWeekDates(selectedWeek)[dayIndex]}
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

      {/* Main content */}
      <main className="flex-1 p-4 pt-28 max-w-7xl mx-auto w-full">
        <div className="bg-[#333333] rounded-lg p-4 mt-4">
          <ScheduleEditor 
            schedule={schedule} 
            onChange={handleScheduleChange} 
            userColor={userColor} 
            onSave={handleSave} 
            use24HourFormat={use24HourFormat}
            userName={userName}
            weekDate={selectedWeek}
          />
        </div>
      </main>
    </div>
  )
}

// The new default export uses Suspense to handle client-side parameter loading
export default function EditSchedule() {
  return (
    <Suspense fallback={<div className="flex flex-col min-h-screen bg-[#282828] text-white items-center justify-center"><p className="text-[#A0A0A0]">Loading Schedule...</p></div>}>
      <EditSchedulePage />
    </Suspense>
  )
}
