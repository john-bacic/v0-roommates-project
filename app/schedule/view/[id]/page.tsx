"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { supabase, fetchUserSchedule, User, TimeBlock as SupabaseTimeBlock } from "@/lib/supabase"

export default function ViewSchedule() {
  const params = useParams()
  const router = useRouter()
  const [roommate, setRoommate] = useState<User | null>(null)
  const [schedule, setSchedule] = useState<Record<string, Array<SupabaseTimeBlock>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserName, setCurrentUserName] = useState("")

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

  const isCurrentUser = roommate.name === currentUserName

  // Time conversion helper
  const timeToPosition = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes
    const startMinutes = 6 * 60 // 6:00 AM
    const endMinutes = 24 * 60 // 24:00 (midnight)
    return ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100
  }

  // Format time for display
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 === 0 ? 12 : hours % 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const hours = Array.from({ length: 19 }, (_, i) => i + 6) // 6 to 24 (midnight)

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      <header className="sticky top-0 z-50 p-4 border-b border-[#333333] bg-[#282828]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center text-[#A0A0A0] hover:text-white mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{
                  backgroundColor: roommate.color,
                  color: ["#BB86FC", "#03DAC6", "#FFB74D", "#FFD54F", "#64B5F6", "#81C784"].includes(roommate.color) ? "#000" : "#fff",
                }}
              >
                {roommate.initial}
              </div>
              <h1 className="text-xl font-bold">
                {roommate.name}'s Schedule {isCurrentUser ? "(You)" : ""}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {days.map((day) => (
          <div key={day} className="mb-6">
            <div className="sticky bg-[#282828] pt-2 pb-1 flex items-center justify-between px-2">
              <div className="text-sm font-medium">{day}</div>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide">
              <div className="min-w-[800px] pl-2">
                {/* Time header */}
                <div className="sticky bg-[#282828] pt-1 pb-2">
                  <div className="relative h-6">
                    <div className="absolute inset-0 flex">
                      {hours.map((hour) => (
                        <div key={hour} className="flex-1 relative">
                          <div
                            className="absolute top-0 text-[10px] text-[#666666] whitespace-nowrap"
                            style={{ left: `${((hour - 6) / 18) * 100}%` }}
                          >
                            {hour === 24 ? "12AM" : hour > 12 ? `${hour-12}PM` : `${hour}AM`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schedule timeline */}
                <div className="relative h-10 bg-[#333333] rounded-md overflow-hidden mt-2">
                  {/* Vertical grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {hours.map((hour) => (
                      <div key={hour} className="flex-1 border-l border-[#333333] first:border-l-0 h-full" />
                    ))}
                  </div>

                  {/* Schedule blocks */}
                  {schedule[day]?.map((block, index) => {
                    // For all-day events, span the entire width
                    const startPos = block.allDay ? 0 : timeToPosition(block.start)
                    const endPos = block.allDay ? 100 : timeToPosition(block.end)
                    const width = block.allDay ? 100 : endPos - startPos

                    return (
                      <div
                        key={block.id || index}
                        className="absolute top-0 h-full rounded-md flex items-center justify-center"
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                          backgroundColor: roommate.color,
                          color: ["#BB86FC", "#03DAC6", "#FFB74D", "#FFD54F", "#64B5F6", "#81C784"].includes(roommate.color) ? "#000" : "#fff"
                        }}
                        title={`${block.label}${block.allDay ? " (All Day)" : `: ${block.start} - ${block.end}`}`}
                      >
                        {width > 15 && (
                          <div className="flex items-center justify-center w-full">
                            <span className="text-xs font-medium truncate px-2">
                              {block.label}
                              {block.allDay ? " (All Day)" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
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
