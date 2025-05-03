'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit2 } from 'lucide-react'

interface User {
  id: number
  name: string
  color: string
  initial: string
}

interface TimeBlock {
  id?: string
  start: string
  end: string
  label: string
  allDay?: boolean
}

interface SingleDayViewProps {
  users: User[]
  schedules: Record<number, Record<string, Array<TimeBlock>>>
  day: string
  use24HourFormat?: boolean
  onBlockClick: (user: User, day: string, block: TimeBlock) => void
  onAddClick: (user: User, day: string) => void
  currentUserName: string
}

// Helper function to get text color based on background color
const getTextColor = (bgColor: string): string => {
  return "#000" // Always use dark text against colored backgrounds
}

export function SingleDayView({ 
  users, 
  schedules, 
  day, 
  use24HourFormat = false,
  onBlockClick,
  onAddClick,
  currentUserName
}: SingleDayViewProps) {
  // Calculate hours to display from 6am to 6am (next day)
  const hours = Array.from({ length: 25 }, (_, i) => (i + 6) % 24)
  
  // Format hour display based on user preference
  const formatHour = (hour: number): string => {
    // Add asterisk to indicate early morning hours (0-5) belong to the next day
    const nextDayIndicator = (hour >= 0 && hour < 6) ? '*' : ''
    
    if (use24HourFormat) {
      return `${hour.toString().padStart(2, '0')}:00${nextDayIndicator}`
    } else {
      const period = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour % 12 || 12
      return `${displayHour}${period}${nextDayIndicator}`
    }
  }
  
  // Format time string (HH:MM) to match hour labels
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number)
    
    // Add asterisk to indicate early morning hours (0-5) belong to the next day
    const nextDayIndicator = (hours >= 0 && hours < 6) ? '*' : ''
    
    if (use24HourFormat) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${nextDayIndicator}`
    } else {
      const period = hours >= 12 ? 'pm' : 'am'
      const displayHour = hours % 12 || 12
      return `${displayHour}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''}${period}${nextDayIndicator}`
    }
  }
  
  // Calculate time position in percentage for the grid
  const calculateTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    let totalMinutes = hours * 60 + minutes
    
    // For hours 0-5 (12am-5:59am), add 24 hours to place them after the 6pm-11:59pm time slots
    if (hours >= 0 && hours < 6) {
      totalMinutes += 24 * 60 // Add 24 hours in minutes
    }
    
    const startMinutes = 6 * 60 // 6am
    const totalDuration = 24 * 60 // 24 hours (6am to 6am next day)
    
    // Calculate position as percentage of the timeline
    return ((totalMinutes - startMinutes) / totalDuration) * 100
  }
  
  return (
    <div className="w-full">
      {/* Time grid with hour labels */}
      <div className="relative">
        {/* Hour labels column */}
        <div className="flex">
          <div className="w-12 min-w-12 sm:w-16 sm:min-w-16">
            {/* Empty cell for top-left corner */}
          </div>
          
          {/* Main content area */}
          <div className="flex-grow relative">
            {/* Simple header bar - no user indicators needed */}
            <div className="h-6 border-b border-gray-700">
              {/* Empty header - user indicators are now on each block */}
            </div>
            
            {/* Time grid with blocks */}
            <div className="relative" style={{ height: `${hours.length * 8}rem` }}>
              {/* Hour lines */}
              {hours.map((hour, index) => (
                <div 
                  key={`hour-${index}`} 
                  className="absolute w-full border-b border-gray-700"
                  style={{ top: `${(index / hours.length) * 100}%` }}
                >
                  <div className="absolute -left-16 -top-3 text-xs text-[#666666]">
                    {formatHour(hour)}
                  </div>
                </div>
              ))}
              
              {/* Time blocks for each user */}
              {users.map((user) => {
                const userBlocks = schedules[user.id]?.[day] || [];
                const userIndex = users.findIndex(u => u.id === user.id);
                const totalUsers = users.length;
                const columnWidth = 100 / totalUsers;
                const leftPosition = userIndex * columnWidth;
                
                // All-day events
                const allDayBlocks = userBlocks
                  .filter(block => block.allDay)
                  .map((block, blockIndex) => (
                    <div 
                      key={`all-day-${block.id || `${day}-${user.id}-${blockIndex}`}`}
                      className={`absolute rounded-md shadow-md border-2 transition-all duration-200 ${user.name === currentUserName ? 'cursor-pointer hover:brightness-110 active:brightness-90' : 'cursor-default'}`}
                      style={{
                        top: 0,
                        height: '100%',
                        left: `${leftPosition + columnWidth * 0.05}%`,
                        width: `${columnWidth * 0.9}%`,
                        backgroundColor: `${user.color}20`,
                        borderColor: user.color,
                        zIndex: 15,
                        backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0 0 0 / 0.5) 5px, rgba(0 0 0 / 0.5) 10px)"
                      }}
                      onClick={() => onBlockClick(user, day, block)}
                      title={`${user.name}: ${block.label} (All Day)`}
                      data-component-name="SingleDayView"
                    >
                      <div 
                        className="absolute -top-4 left-1/2 transform -translate-x-1/2 rounded-full flex items-center justify-center w-8 h-8 text-sm font-bold shadow-md border border-gray-700 z-50"
                        style={{
                          backgroundColor: user.color,
                          color: getTextColor(user.color),
                        }}
                        data-component-name="SingleDayView"
                      >
                        {user.initial}
                      </div>
                      
                      <div className="p-2 pt-4 pl-4 h-full flex flex-col overflow-hidden" style={{ zIndex: 10 }} data-component-name="SingleDayView">
                        <div className="flex flex-wrap items-start max-w-full" data-component-name="SingleDayView">
                          <span className="text-xs font-bold leading-tight break-words" style={{ color: user.color }} data-component-name="SingleDayView">
                            {block.label}{" (All Day)"}
                          </span>
                          {user.name === currentUserName && (
                            <Edit2 className="h-3 w-3 ml-1 flex-shrink-0" style={{ color: user.color }} />
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                
                // Regular time blocks
                const regularBlocks = userBlocks
                  .filter(block => !block.allDay)
                  .map((block, blockIndex) => {
                    const startPosition = calculateTimePosition(block.start);
                    const endPosition = calculateTimePosition(block.end);
                    
                    return (
                      <div 
                        key={`block-${block.id || `${day}-${user.id}-${blockIndex}`}`}
                        className={`absolute rounded-md shadow-md border border-gray-700 transition-all duration-200 ${user.name === currentUserName ? 'cursor-pointer hover:brightness-110 active:brightness-90' : 'cursor-default'}`}
                        style={{
                          top: `${startPosition}%`,
                          height: `${endPosition - startPosition}%`,
                          left: `${leftPosition + columnWidth * 0.05}%`,
                          width: `${columnWidth * 0.9}%`,
                          backgroundColor: user.color,
                          zIndex: 20,
                        }}
                        onClick={() => onBlockClick(user, day, block)}
                        title={`${user.name}: ${block.label} (${block.start} - ${block.end})`}
                        data-component-name="SingleDayView"
                      >
                        {/* User initial centered on top of the block */}
                        <div 
                          className="absolute -top-4 left-1/2 transform -translate-x-1/2 rounded-full flex items-center justify-center w-8 h-8 text-sm font-bold shadow-md border border-gray-700 z-50"
                          style={{
                            backgroundColor: user.color,
                            color: getTextColor(user.color),
                          }}
                          data-component-name="SingleDayView"
                        >
                          {user.initial}
                        </div>
                        
                        <div className="p-2 pt-4 pl-4 h-full flex flex-col overflow-hidden" style={{ zIndex: 10 }} data-component-name="SingleDayView">
                          <div className="flex flex-col items-start justify-start w-full overflow-hidden" data-component-name="SingleDayView">
                            <span className="text-xs opacity-80 mb-1 mt-1 font-bold leading-tight whitespace-nowrap" style={{ color: getTextColor(user.color) }} data-component-name="SingleDayView">
                              {formatTime(block.start)} - {formatTime(block.end)}
                            </span>
                            <div className="flex flex-wrap items-start max-w-full">
                              <span className="text-xs font-bold leading-tight break-words" style={{ color: getTextColor(user.color) }} data-component-name="SingleDayView">
                                {block.label}
                              </span>
                              {user.name === currentUserName && (
                                <Edit2 className="h-3 w-3 ml-1 flex-shrink-0" style={{ color: getTextColor(user.color) }} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                
                return [...allDayBlocks, ...regularBlocks];
              })}
              
              {/* No floating add button - using the main edit button from Overview page instead */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
