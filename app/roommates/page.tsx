"use client"
import Link from "next/link"
import { ArrowLeft, Share2, Copy, Check, Edit2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { QRCodeSVG } from "qrcode.react"
import { usePathname } from "next/navigation"

// Initial users data as fallback
const initialUsers = [
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
  const [roommates, setRoommates] = useState(initialUsers)
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
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs mb-1 text-white">{day}</div>
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            backgroundColor: !roommate.availableDays.includes(index) 
                              ? '#FF5252' 
                              : '#333333' 
                          }}
                          title={`${!roommate.availableDays.includes(index) ? 'Day off' : 'Available'} on ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}`}
                        ></div>
                      </div>
                    ))}
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
