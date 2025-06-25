"use client"

import { Suspense } from 'react';
import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Trash2, Check, CheckCheck, X } from "lucide-react"
import { useMessages } from "@/hooks/use-messages"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

function MessagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [newMessage, setNewMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [userColor, setUserColor] = useState("#B388F5") // Default color
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)
  const { toast } = useToast()

  // Get current user from localStorage and database
  useEffect(() => {
    const userName = localStorage.getItem("userName")
    // Map userName to userId (in a real app, this would come from auth)
    const userMap: Record<string, number> = {
      "Riko": 1,
      "Narumi": 2,
      "John": 3
    }
    const userId = userMap[userName || ""] || 1
    setCurrentUserId(userId)
    
    // Get user color from localStorage first
    const storedColor = localStorage.getItem(`userColor_${userName}`)
    if (storedColor) {
      setUserColor(storedColor)
    }
    
    // Also fetch from database to ensure we have the latest color
    if (userName) {
      const fetchUserColor = async () => {
        try {
          // Import Supabase here to avoid SSR issues
          const { supabase } = await import('@/lib/supabase')
          
          const { data: userData, error } = await supabase
            .from('users')
            .select('color')
            .eq('name', userName)
            .single()
          
          if (!error && userData?.color) {
            console.log(`[Messages] Fetched user color for ${userName}:`, userData.color)
            setUserColor(userData.color)
            // Update localStorage with latest color
            localStorage.setItem(`userColor_${userName}`, userData.color)
          } else {
            console.error('Failed to fetch user color from database:', error)
          }
        } catch (error) {
          console.error('Failed to fetch user color:', error)
        }
      }
      fetchUserColor()
    }
  }, [])

  // Listen for storage changes (color updates from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const userName = localStorage.getItem("userName")
      if (e.key === `userColor_${userName}` && e.newValue) {
        console.log(`[Messages] Color updated from storage:`, e.newValue)
        setUserColor(e.newValue)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Handle mobile keyboard detection and viewport changes
  useEffect(() => {
    // Store initial viewport height
    const initialHeight = window.innerHeight
    setViewportHeight(initialHeight)
    
    const handleResize = () => {
      const newHeight = window.innerHeight
      const heightDifference = initialHeight - newHeight
      
      // If viewport height decreased by more than 150px, assume keyboard is open
      const keyboardOpen = heightDifference > 150
      setIsKeyboardOpen(keyboardOpen)
      setViewportHeight(newHeight)
      
      // Scroll to bottom when keyboard opens to keep recent messages visible
      if (keyboardOpen && messagesEndRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      }
    }
    
    const handleFocus = () => {
      // Set keyboard open state immediately for responsive feel
      setIsKeyboardOpen(true)
      
      // Ensure messages scroll to bottom when input is focused
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 200)
    }
    
    const handleBlur = () => {
      // Small delay to allow for quick refocus (like sending message)
      setTimeout(() => {
        // Only close if the input is truly not focused
        if (inputRef.current && document.activeElement !== inputRef.current) {
          setIsKeyboardOpen(false)
        }
      }, 150)
    }
    
    // Add event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    // Add focus/blur listeners to input when it's available
    const input = inputRef.current
    if (input) {
      input.addEventListener('focus', handleFocus)
      input.addEventListener('blur', handleBlur)
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (input) {
        input.removeEventListener('focus', handleFocus)
        input.removeEventListener('blur', handleBlur)
      }
    }
  }, [])

  const { messages, loading, error, sendMessage, markAsRead, deleteMessage } = useMessages({
    userId: currentUserId || 1,
    pollInterval: 10000 // Poll every 10 seconds
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Also scroll to bottom when component first loads
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" })
    }
  }, [messages.length])

  // Mark messages as read when viewing
  useEffect(() => {
    if (currentUserId && messages.length > 0) {
      messages.forEach(msg => {
        if (!msg.is_read && msg.sender_id !== currentUserId) {
          markAsRead(msg.id)
        }
      })
    }
  }, [messages, currentUserId, markAsRead])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId) return

    try {
      await sendMessage(newMessage.trim())
      setNewMessage("")
      toast({ title: "Message sent!", duration: 2000 })
    } catch (error) {
      toast({ title: "Failed to send message", description: String(error), variant: "destructive" })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(messageId)
        toast({ title: "Message deleted", duration: 2000 })
      } catch (error) {
        toast({ title: "Failed to delete message", description: String(error), variant: "destructive" })
      }
    }
  }

  if (!currentUserId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
          <div 
            className="flex flex-col text-white min-h-screen relative overflow-hidden"
            style={{ 
              backgroundColor: 'var(--color-bg-dark, #1e1e1e)',
              height: '100vh',
              maxHeight: isKeyboardOpen ? `${viewportHeight}px` : '100vh',
              overflow: 'hidden'
            }}
          >
            {/* Background SVG texture */}
            <img 
              src="/BGlines.svg" 
              alt="background texture" 
              className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-60 z-0"
              aria-hidden="true"
            />
            {/* Main header - fixed at the top */}
            <header className="fixed top-0 left-0 right-0 z-[100] bg-[#242424] shadow-md border-b border-[#333333]">
              <div className="flex items-center justify-between max-w-7xl mx-auto h-[57px] px-4 w-full">
                <button onClick={() => router.back()} className="text-white hover:opacity-80 cursor-pointer">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold text-white absolute left-1/2 transform -translate-x-1/2">Group chat</h1>
                <div className="w-6"></div>
              </div>
            </header>

            {/* Spacer to account for fixed header */}
            <div className="h-[57px] flex-shrink-0"></div>

            {/* Main content */}
            <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full relative">
              {/* Messages list */}
              <ScrollArea 
                className="flex-1 p-2 sm:p-4 scrollbar-hide" 
                style={{ 
                  scrollBehavior: "smooth",
                  height: isKeyboardOpen ? `calc(${viewportHeight}px - 57px - 70px)` : 'calc(100vh - 57px - 70px)',
                  marginBottom: '70px'
                }}
              >
                <div className="min-h-full flex flex-col justify-end space-y-4 pb-2">
                  {/* Reduced spacer */}
                  <div className="h-2"></div>
                  {loading && messages.length === 0 ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : error ? (
                    <div className="text-center text-red-500">Error: {error}</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">No messages yet. Start a conversation!</div>
                  ) : (
                    <>
                      {messages.length === 1 && <div className="h-20 block sm:hidden"></div>}
                      {messages.map((message) => {
                        const isOwnMessage = message.sender_id === currentUserId
                        const readByOthers = message.read_by?.filter(r => r.user_id !== currentUserId) || []
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85vw] sm:max-w-[70%] rounded-lg p-3 ${
                                isOwnMessage
                                  ? "text-black"
                                  : "bg-[#333333] text-white"
                              }`}
                              style={isOwnMessage ? { backgroundColor: userColor } : {}}
                            >
                              {/* Sender name and avatar */}
                              {!isOwnMessage && message.sender && (
                                <div className="flex items-center gap-2 mb-1">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                    style={{ 
                                      backgroundColor: message.sender.color, 
                                      color: "#000" 
                                    }}
                                  >
                                    {message.sender.initial}
                                  </div>
                                  <span className="text-xs font-medium">
                                    {message.sender.name}
                                  </span>
                                </div>
                              )}
                              
                              {/* Message content */}
                              <p className="break-words whitespace-pre-line">{message.content}</p>
                              
                              {/* Timestamp and read receipts */}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs opacity-70">
                                  {format(new Date(message.created_at), "h:mm a")}
                                </span>
                                
                                <div className="flex items-center gap-1">
                                  {isOwnMessage && (
                                    <>
                                      {/* Delete button */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-70 hover:opacity-100"
                                        onClick={() => handleDeleteMessage(message.id)}
                                        style={{ color: "#000" }}
                                      >
                                        <Trash2 className="h-3 w-3" style={{ color: "#000" }} />
                                      </Button>
                                      
                                      {/* Read receipts */}
                                      {readByOthers.length > 0 && (
                                        <div className="flex items-center" title={`Read by ${readByOthers.map(r => r.user?.name).join(", ")}`}>
                                          <CheckCheck className="h-3 w-3" style={{ color: "#000" }} />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </main>

            {/* Message input - always pinned at bottom, adapts to keyboard */}
            <div 
              className="fixed bottom-0 left-0 right-0 bg-[#282828] border-t border-[#333333] shadow-lg transition-transform duration-200 ease-out"
              style={{
                zIndex: 50,
                transform: isKeyboardOpen ? 'translateY(0)' : 'translateY(0)',
                paddingBottom: isKeyboardOpen ? 'env(safe-area-inset-bottom, 0px)' : 'env(safe-area-inset-bottom, 1.5rem)'
              }}
            >
              <form onSubmit={handleSendMessage} className="px-4 py-4">
                <div className="flex gap-2 max-w-7xl mx-auto">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="bg-[#333333] border-gray-600 text-white rounded-full pr-10"
                      autoComplete="off"
                      maxLength={500}
                      style={{
                        fontSize: '16px', // Prevents zoom on iOS
                        WebkitAppearance: 'none'
                      }}
                    />
                    {newMessage.trim() && (
                      <button
                        type="button"
                        onClick={() => setNewMessage("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {newMessage.trim() && (
                    <Button 
                      type="submit" 
                      className="rounded-full h-10 w-10 p-0 border-0 hover:opacity-90 transition-opacity"
                      style={{ 
                        backgroundColor: userColor,
                        color: "#000",
                        borderColor: userColor
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesPage />
    </Suspense>
  );
} 