"use client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

// Initial users data as fallback
const initialUsers = [
  {
    id: 1,
    name: "Riko",
    color: "#BB86FC",
    initial: "R",
    description: "Classes: Mon-Fri, Works part-time on weekends",
    availableDays: [0, 1, 2, 3, 4] // Monday to Friday
  },
  { 
    id: 2, 
    name: "Narumi", 
    color: "#03DAC6", 
    initial: "N", 
    description: "Works: Tue-Sat, Free on Sun-Mon",
    availableDays: [1, 2, 3, 4, 5] // Tuesday to Saturday
  },
  { 
    id: 3, 
    name: "John", 
    color: "#FFD54F", 
    initial: "J", 
    description: "Classes: Mon-Thu, Works evenings on Fri",
    availableDays: [0, 1, 2, 3] // Monday to Thursday
  },
]

export default function Roommates() {
  const [roommates, setRoommates] = useState(initialUsers)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: usersData, error } = await supabase
          .from('users')
          .select('*')

        if (error) {
          console.error('Error fetching users:', error)
        } else if (usersData && usersData.length > 0) {
          // Map the users to include the description and availableDays properties
          const mappedUsers = usersData.map(user => {
            const initialUser = initialUsers.find(u => u.id === user.id);
            return {
              ...user,
              description: initialUser?.description || "Available times vary",
              availableDays: initialUser?.availableDays || []
            };
          });
          setRoommates(mappedUsers);
        }
      } catch (error) {
        console.error('Error in fetchUsers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Set up real-time subscription
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersSubscription);
    };
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Header - now sticky */}
      <header className="sticky top-0 z-50 border-b border-[#333333] bg-[#121212] p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center text-[#A0A0A0] hover:text-white mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schedule
            </Link>
            <h1 className="text-xl font-bold">Roommates</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roommates.map((roommate) => (
            <Card key={roommate.id} className="bg-[#1E1E1E] border-[#333333]">
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
                  <h4 className="text-xs font-medium text-[#A0A0A0] mb-2">TYPICAL AVAILABILITY</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs mb-1 text-white">{day}</div>
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            backgroundColor: roommate.availableDays.includes(index) 
                              ? roommate.color 
                              : '#333333' 
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-4 border-[#333333] hover:bg-[#242424] hover:text-white"
                >
                  <Link href={`/schedule/view/${roommate.id}`}>View Schedule</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
