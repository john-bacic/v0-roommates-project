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
  const { toast } = useToast()

  // Get current user from localStorage
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
    
    // Get user color from localStorage or use default
    const storedColor = localStorage.getItem(`userColor_${userName}`)
    if (storedColor) {
      setUserColor(storedColor)
    }
  }, [])

  const { messages, loading, error, sendMessage, markAsRead, deleteMessage } = useMessages({
    userId: currentUserId || 1,
    pollInterval: 10000 // Poll every 10 seconds
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
          <div className="flex flex-col min-h-screen bg-[#282828] text-white">
        {/* Main header - fixed at the top */}
        <header className="fixed top-0 left-0 right-0 z-[100] bg-[#242424] shadow-md border-b border-[#333333]">
          <div className="flex items-center justify-between max-w-7xl mx-auto h-[57px] px-4 w-full">
            <button onClick={() => router.back()} className="text-white hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h1 className="text-lg font-semibold text-white absolute left-1/2 transform -translate-x-1/2">Messages</h1>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Spacer to account for fixed header */}
        <div className="h-[57px]"></div>

        {/* Main content */}
        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full relative">
          {/* Messages list */}
          <ScrollArea className="flex-1 p-2 sm:p-4">
            <div className="space-y-4 pb-2 sm:pb-4">
              {loading && messages.length === 0 ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : error ? (
                <div className="text-center text-red-500">Error: {error}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet. Start a conversation!</div>
              ) : (
                messages.map((message) => {
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
                            ? "bg-blue-600 text-white"
                            : "bg-[#333333] text-white"
                        }`}
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
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                
                                {/* Read receipts */}
                                {readByOthers.length > 0 && (
                                  <div className="flex items-center" title={`Read by ${readByOthers.map(r => r.user?.name).join(", ")}`}>
                                    <CheckCheck className="h-3 w-3 text-blue-300" />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Add bottom padding to prevent messages from being hidden behind floating input */}
          <div className="h-32"></div>
        </main>

        {/* Floating message input */}
        <form onSubmit={handleSendMessage} className="fixed bottom-0 left-0 right-0 z-50 px-4 py-2 sm:py-4 pb-8 bg-transparent shadow-lg">
          <div className="flex gap-2 max-w-7xl mx-auto">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-[#333333] border-gray-600 text-white rounded-full pr-10"
                autoComplete="off"
                maxLength={500}
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
                className="rounded-full h-10 w-10 p-0"
                style={{ 
                  backgroundColor: userColor,
                  color: "#000"
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
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