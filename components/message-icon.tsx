"use client"

import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface MessageIconProps {
  unreadCount: number
  userId?: number
}

export function MessageIcon({ unreadCount, userId }: MessageIconProps) {
  return (
    <Link href={`/messages${userId ? `?userId=${userId}` : ''}`}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 relative"
        title={unreadCount > 0 ? `${unreadCount} unread messages` : "Messages"}
      >
        <MessageSquare className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  )
} 