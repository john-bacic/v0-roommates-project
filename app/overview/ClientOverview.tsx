"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Edit2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { SingleDayView } from "@/components/single-day-view";
import { supabase, fetchWeekSchedules } from "@/lib/supabase";
import { parseWeekParam, formatWeekRange, isSameWeek } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { useScheduleEvents, emitWeekChange } from "@/lib/schedule-events";
import { useSearchParams } from "next/navigation";

// Initial users data as fallback
const initialUsers = [
  { id: 1, name: "Riko", color: "#FF7DB1", initial: "R" },
  { id: 2, name: "Narumi", color: "#63D7C6", initial: "N" },
  { id: 3, name: "John", color: "#F8D667", initial: "J" },
];

const getTextColor = (bgColor: string): string => {
  return "#000";
};

export default function ClientOverview() {
  const [usersList, setUsersList] = useState<typeof initialUsers>(initialUsers);
  const [schedules, setSchedules] = useState<Record<number, Record<string, Array<{ start: string; end: string; label: string; allDay?: boolean }>>>>({});
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getWeekDates = () => {
    const weekStart = new Date(selectedWeek);
    const startDay = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - startDay);
    return days.map((_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date.getDate();
    });
  };
  const [userName, setUserName] = useState("");
  const [userColor, setUserColor] = useState("#FF7DB1");
  const [use24HourFormat, setUse24HourFormat] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedFormat = localStorage.getItem('use24HourFormat');
      return savedFormat === 'true';
    }
    return false;
  });

  const getCurrentDay = (): string | null => {
    const now = new Date();
    const hours = now.getHours();
    let adjustedDate = new Date(now);
    if (hours < 6) {
      adjustedDate.setDate(now.getDate() - 1);
    }
    const weekStart = new Date(selectedWeek);
    weekStart.setDate(selectedWeek.getDate() - selectedWeek.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const isCurrentWeek = adjustedDate >= weekStart && adjustedDate <= weekEnd;
    if (!isCurrentWeek) {
      return null;
    }
    const dayIndex = adjustedDate.getDay();
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
  };
  const currentDayName = getCurrentDay();
  const [selectedDay, setSelectedDay] = useState<string>(getCurrentDay() || "Monday");
  const searchParams = useSearchParams();
  useEffect(() => {
    const weekParam = searchParams.get("week");
    if (weekParam) setSelectedWeek(parseWeekParam(weekParam));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const usersData = await supabase.from('users').select('*');
      if (usersData.error) throw usersData.error;
      if (usersData.data && usersData.data.length > 0) {
        const formattedUsers = usersData.data.map((user: { id: number; name: string; color: string }) => ({
          id: user.id as number,
          name: user.name as string,
          color: user.color as string,
          initial: (user.name as string).charAt(0).toUpperCase()
        }));
        setUsersList(formattedUsers);
        const storedName = localStorage.getItem('userName');
        if (storedName) {
          const currentUser = formattedUsers.find((u: { name: string; color: string }) => u.name === storedName);
          if (currentUser) {
            setUserColor(currentUser.color);
          }
        }
        const weekSchedules = await fetchWeekSchedules(selectedWeek);
        const schedulesData: Record<number, Record<string, Array<{id: string; start: string; end: string; label: string; allDay?: boolean}>>> = {};
        Object.entries(weekSchedules).forEach(([userIdStr, userSchedule]) => {
          const userId = parseInt(userIdStr);
          schedulesData[userId] = {};
          Object.entries(userSchedule).forEach(([day, blocks]) => {
            schedulesData[userId][day] = blocks.map(block => ({
              id: block.id,
              start: block.start,
              end: block.end,
              label: block.label,
              allDay: block.allDay
            }));
          });
        });
        setSchedules(schedulesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedWeek]);

  useEffect(() => {
    const events = useScheduleEvents();
    const unsubscribeSchedule = events.on('schedule-updated', (event) => {
      if (event.detail.source !== 'overview') {
        loadData();
      }
    });
    const unsubscribeWeek = events.on('week-changed', (event) => {
      if (event.detail.source !== 'overview' && event.detail.weekDate) {
        setSelectedWeek(event.detail.weekDate);
      }
    });
    const unsubscribeSync = events.on('sync-required', () => {
      loadData();
    });
    return () => {
      unsubscribeSchedule();
      unsubscribeWeek();
      unsubscribeSync();
    };
  }, []);

  const goToPreviousDay = () => {
    const currentIndex = days.indexOf(selectedDay);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : days.length - 1;
    selectDay(days[prevIndex]);
  };
  const goToNextDay = () => {
    const currentIndex = days.indexOf(selectedDay);
    const nextIndex = currentIndex < days.length - 1 ? currentIndex + 1 : 0;
    selectDay(days[nextIndex]);
  };
  const selectDay = (day: string) => {
    setSelectedDay(day);
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Header - fixed at the top */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#333333] bg-[#242424] p-4 pb-0 shadow-md min-h-[97px]" data-component-name="Overview">
        <div className="flex flex-col max-w-7xl mx-auto w-full" data-component-name="Overview">
          <div className="flex items-center justify-between w-full mb-3" data-component-name="Overview">
            <div className="flex items-center group w-[72px]">
              <Link 
                href={`/dashboard?week=${selectedWeek.toISOString().split('T')[0]}`} 
                className="flex items-center text-white hover:opacity-80"
                data-component-name="LinkComponent"
                title="Back to Dashboard"
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
                  const prevWeek = new Date(selectedWeek)
                  prevWeek.setDate(selectedWeek.getDate() - 7)
                  setSelectedWeek(prevWeek)
                  emitWeekChange(prevWeek, 'overview')
                }}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4 text-[#A0A0A0]" />
                <span className="sr-only">Previous week</span>
              </Button>
              <h1 
                className={`text-sm font-medium mx-2 ${isSameWeek(selectedWeek, new Date()) ? '' : 'text-[#A0A0A0]'}`} 
                style={isSameWeek(selectedWeek, new Date()) ? { color: userColor } : {}}
                data-component-name="Overview"
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
                  setSelectedWeek(nextWeek)
                  emitWeekChange(nextWeek, 'overview')
                }}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4 text-[#A0A0A0]" />
                <span className="sr-only">Next week</span>
              </Button>
            </div>
            {/* Time format toggle button */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-none border-none rounded-full ml-auto flex items-center justify-center transition-colors"
                onClick={() => {
                  const newFormat = !use24HourFormat
                  setUse24HourFormat(newFormat)
                  localStorage.setItem('use24HourFormat', newFormat.toString())
                }}
                title={`Switch to ${use24HourFormat ? '12-hour' : '24-hour'} format`}
                data-component-name="_c"
              >
                <Clock
                  className="h-5 w-5 text-[#A0A0A0] transition-transform duration-300"
                  style={{
                    transform: use24HourFormat ? 'rotateY(180deg)' : 'none'
                  }}
                />
                <span className="sr-only">
                  {use24HourFormat ? '24h' : '12h'}
                </span>
              </Button>
            )}
          </div>
          {/* Day selector tabs moved to header */}
          <div className="flex w-full" role="tablist" aria-label="Day selector" data-component-name="Overview">
            {days.map((day) => {
              const isActive = selectedDay === day;
              const dayIndex = days.indexOf(day);
              const prevDay = dayIndex > 0 ? days[dayIndex - 1] : days[days.length - 1];
              const nextDay = dayIndex < days.length - 1 ? days[dayIndex + 1] : days[0];
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
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
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      selectDay(prevDay)
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault()
                      selectDay(nextDay)
                    }
                  }}
                >
                  <div className="w-full flex flex-col md:flex-row items-center justify-center h-full md:space-x-1">
                    <span className={`${day === currentDayName && isSameWeek(selectedWeek, new Date()) ? 'text-red-500 font-bold' : ''} leading-none`}>
                      <span className="md:hidden">{day.substring(0, 1)}</span>
                      <span className="hidden md:inline">{day.substring(0, 3)}</span>
                    </span>
                    <span className={`${day === currentDayName && isSameWeek(selectedWeek, new Date()) ? 'text-red-500 font-bold' : 'text-inherit'} text-xs leading-none`}>
                      {getWeekDates()[days.indexOf(day)]}
                    </span>
                  </div>
                  {isActive && (
                    <span 
                      className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-sm ${day === currentDayName && isSameWeek(selectedWeek, new Date()) ? 'bg-red-500' : ''}`}
                      style={day !== currentDayName || !isSameWeek(selectedWeek, new Date()) ? { backgroundColor: userColor } : {}}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>
      {/* Main content - add padding to account for fixed header with tabs */}
      <main className="flex-1 p-4 pt-32 max-w-7xl mx-auto w-full">
        <div className="bg-[#282828] rounded-lg md:p-4 p-2">
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
              selectedWeek={selectedWeek}
              onBlockClick={(user, day, block) => {
                window.location.href = `/schedule/edit?day=${encodeURIComponent(day)}&user=${encodeURIComponent(user.name)}&from=%2Foverview&week=${selectedWeek.toISOString().split('T')[0]}`;
              }}
              onAddClick={(user, day) => {
                window.location.href = `/schedule/edit?day=${encodeURIComponent(day)}&user=${encodeURIComponent(user.name)}&from=%2Foverview&week=${selectedWeek.toISOString().split('T')[0]}`;
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
            <Link href={`/schedule/edit?day=${encodeURIComponent(selectedDay)}&from=%2Foverview&week=${selectedWeek.toISOString().split('T')[0]}`}>
              <Edit2 className="h-6 w-6" />
              <span className="sr-only">Edit schedule</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
} 