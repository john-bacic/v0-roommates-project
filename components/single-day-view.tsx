'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Clock } from 'lucide-react'
import { supabase } from "@/lib/supabase"

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
  onTimeFormatChange?: (use24Hour: boolean) => void
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
  currentUserName,
  onTimeFormatChange
}: SingleDayViewProps) {
  // State for 24-hour time format toggle
  const [localUse24HourFormat, setLocalUse24HourFormat] = useState(use24HourFormat)
  
  // State for current time position
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0)
  const timeIndicatorRef = useRef<HTMLDivElement>(null)
  
  // Effect to sync with parent component's format
  useEffect(() => {
    setLocalUse24HourFormat(use24HourFormat)
  }, [use24HourFormat])
  
  // Function to get the logical day name based on our schedule logic
  // Hours between midnight and 6am are considered part of the previous day
  const getLogicalDayName = (): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const now = new Date()
    let dayIndex = now.getDay()
    
    // If it's before 6am, consider it the previous day
    if (now.getHours() < 6) {
      // Subtract 1 and handle wrapping around from Sunday to Saturday
      dayIndex = (dayIndex - 1 + 7) % 7
    }
    
    return days[dayIndex]
  }
  
  // Check if the day being viewed is the current logical day
  const isCurrentDay = getLogicalDayName() === day
  
  // State to track the current hour for day transition checks
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours())
  
  // State to track if we need to refresh data
  const [needsRefresh, setNeedsRefresh] = useState(false)
  
  // Function to fetch latest schedules directly from Supabase
  const fetchLatestSchedules = useCallback(async () => {
    try {
      // Get all schedules for the current users
      const userIds = users.map(user => user.id)
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .in('user_id', userIds)
      
      if (error) {
        console.error('Error fetching schedules:', error)
        return
      }
      
      if (data && data.length > 0) {
        // Process the data into the format expected by the component
        const updatedSchedules = {...schedules}
        
        // Reset schedules for the affected users
        for (const userId of userIds) {
          if (!updatedSchedules[userId]) {
            updatedSchedules[userId] = {}
          }
          
          // Initialize empty arrays for each day
          for (const dayName of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
            if (!updatedSchedules[userId][dayName]) {
              updatedSchedules[userId][dayName] = []
            }
          }
        }
        
        // Add the fetched schedules
        for (const schedule of data) {
          const userId = schedule.user_id
          const dayName = schedule.day
          
          if (updatedSchedules[userId] && dayName) {
            // Find if this schedule already exists in our array
            const existingIndex = updatedSchedules[userId][dayName].findIndex(
              (item: TimeBlock) => item.id === schedule.id
            )
            
            const updatedBlock = {
              id: schedule.id,
              start: schedule.start_time,
              end: schedule.end_time,
              label: schedule.label,
              allDay: schedule.all_day
            }
            
            if (existingIndex >= 0) {
              // Update existing schedule
              updatedSchedules[userId][dayName][existingIndex] = updatedBlock
            } else {
              // Add new schedule
              updatedSchedules[userId][dayName].push(updatedBlock)
            }
          }
        }
        
        // Force a re-render by updating the parent component
        // Use a custom event to notify the parent component
        const updateEvent = new CustomEvent('scheduleDataUpdated', { 
          detail: { updatedSchedules } 
        })
        document.dispatchEvent(updateEvent)
        
        setNeedsRefresh(false)
      }
    } catch (error) {
      console.error('Error in fetchLatestSchedules:', error)
    }
  }, [users, schedules, onBlockClick])
  
  // Set up Supabase real-time subscription
  useEffect(() => {
    // Subscribe to schedule changes
    const scheduleSubscription = supabase
      .channel('single-day-view-schedules-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'schedules' 
      }, () => {
        // Mark that we need to refresh data
        setNeedsRefresh(true)
      })
      .subscribe()
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(scheduleSubscription)
    }
  }, [])
  
  // Fetch latest data when needed
  useEffect(() => {
    if (needsRefresh) {
      fetchLatestSchedules()
    }
  }, [needsRefresh, fetchLatestSchedules])

  // Effect to update current time position and handle day transitions
  useEffect(() => {
    // Calculate initial position with improved accuracy
    const updateTimePosition = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()
      
      // Update current hour for transition checks
      setCurrentHour(hours)
      
      // Only update position if we're viewing the current logical day
      if (!isCurrentDay) return
      
      // Include seconds for more precise positioning
      const totalMinutes = hours * 60 + minutes + (seconds / 60)
      
      // Use the same calculation as for time blocks but with seconds precision
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      const position = calculateTimePosition(timeString, seconds)
      setCurrentTimePosition(position)
    }
    
    // Update immediately
    updateTimePosition()
    
    // Then update every 10 seconds for smoother movement
    const interval = setInterval(updateTimePosition, 10000)
    
    return () => clearInterval(interval)
  }, [isCurrentDay, day, currentHour])
  
  // Toggle between 12-hour and 24-hour time format
  const toggleTimeFormat = () => {
    const newFormat = !localUse24HourFormat
    setLocalUse24HourFormat(newFormat)
    
    // Notify parent component if callback provided
    if (onTimeFormatChange) {
      onTimeFormatChange(newFormat)
    }
  }
  
  // Calculate hours to display from 6am to 6am (next day)
  const hours = Array.from({ length: 25 }, (_, i) => (i + 6) % 24)
  
  // Format hour display based on user preference
  const formatHour = (hour: number): string => {
    // Add asterisk to indicate early morning hours (0-5) belong to the next day
    const nextDayIndicator = (hour >= 0 && hour < 6) ? '*' : ''
    
    if (localUse24HourFormat) {
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
    
    if (localUse24HourFormat) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${nextDayIndicator}`
    } else {
      const period = hours >= 12 ? 'pm' : 'am'
      const displayHour = hours % 12 || 12
      return `${displayHour}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''}${period}${nextDayIndicator}`
    }
  }
  
  // Base calculation function for time positions
  const calculateBasePosition = (hours: number, minutes: number = 0, seconds: number = 0): number => {
    // Calculate total minutes from 6am (our start time)
    let totalMinutes = hours * 60 + minutes + (seconds / 60)
    
    // For hours 0-5 (12am-5:59am), add 24 hours to place them after the 6pm-11:59pm time slots
    if (hours >= 0 && hours < 6) {
      totalMinutes += 24 * 60 // Add 24 hours in minutes
    }
    
    const startMinutes = 6 * 60 // 6am
    const totalDuration = 24 * 60 // 24 hours (6am to 6am next day)
    
    // Calculate position as percentage of the timeline
    return ((totalMinutes - startMinutes) / totalDuration) * 100
  }
  
  // Calculate time position for the current time indicator with seconds precision
  const calculateTimePosition = (time: string, seconds: number = 0): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return calculateBasePosition(hours, minutes, seconds)
  }
  
  // Calculate time position for time blocks to ensure alignment
  const calculateBlockPosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return calculateBasePosition(hours, minutes)
  }
  
  // Calculate hour position for the hour grid lines
  const calculateHourPosition = (hour: number): number => {
    return calculateBasePosition(hour)
  }
  
  return (
    <div className="w-full">
      {/* Time grid with hour labels */}
      <div className="relative">
        {/* Hour labels column */}
        <div className="flex">
          <div className="w-10 min-w-10 sm:w-16 sm:min-w-16">
            {/* Empty cell for top-left corner */}
          </div>
          
          {/* Main content area */}
          <div className="flex-grow relative">
            {/* Simple header bar - no user indicators needed */}
            <div className="h-6 border-b border-[#343434]">
              {/* Empty header - user indicators are now on each block */}
            </div>
            
            {/* Time grid with blocks - further reduced height for mobile */}
            <div className="relative" style={{ height: `50rem` }} data-component-name="SingleDayView">
              {/* Hour lines */}
              {hours.map((hour, index) => (
                <div 
                  key={`hour-${index}`} 
                  className="absolute w-full border-b border-[#343434]"
                  style={{ top: `${calculateHourPosition(hour)}%` }}
                >
                  <div className="absolute -left-10 sm:-left-14 -top-3 text-[11px] text-[#666666]" key={`hour-label-${hour}-${index}`} data-component-name="SingleDayView">
                    {formatHour(hour)}
                  </div>
                </div>
              ))}
              
              {/* Current time indicator - only show on current day */}
              {isCurrentDay && (
                <div 
                  ref={timeIndicatorRef}
                  className="absolute w-full border-t-2 border-red-500 z-30"
                  style={{ 
                    top: `${currentTimePosition}%`,
                    boxShadow: '0 0 4px rgba(255, 0, 0, 0.7)',
                    left: '-1px'
                  }}
                  data-component-name="SingleDayView"
                >
                  <div className="absolute -left-3 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-md z-40" data-component-name="SingleDayView"></div>
                </div>
              )}
              
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
                  .sort((a, b) => {
                    // Sort alphabetically by label for consistent display
                    return a.label.localeCompare(b.label);
                  })
                  .map((block, blockIndex) => {
                    const isFirstAllDayBlock = blockIndex === 0; // Check if this is the first all-day block
                    
                    return (
                    <div 
                      key={`all-day-${block.id || `${day}-${user.id}-${blockIndex}`}`}
                      className={`absolute rounded-md shadow-md border-2 transition-all duration-200 ${user.name === currentUserName ? 'cursor-pointer hover:brightness-110 active:brightness-90' : 'cursor-default'}`}
                      style={{
                        top: 0,
                        height: '100%',
                        left: `${leftPosition + columnWidth * 0.02}%`,
                        width: `${columnWidth * 0.96}%`,
                        backgroundColor: `${user.color}20`,
                        borderColor: user.color,
                        zIndex: 15,
                        backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0 0 0 / 0.5) 5px, rgba(0 0 0 / 0.5) 10px)"
                      }}
                      onClick={() => onBlockClick(user, day, block)}
                      title={`${user.name}: ${block.label} (All Day)`}
                      data-component-name="SingleDayView"
                    >
                      {/* User initial centered on top of the block - only shown for the first all-day block */}
                      {isFirstAllDayBlock && (
                        <div 
                          className="absolute -top-3 left-1/2 transform -translate-x-1/2 rounded-full flex items-center justify-center w-6 h-6 text-xs font-bold shadow-md border border-gray-700 z-50"
                          style={{
                            backgroundColor: user.color,
                            color: getTextColor(user.color),
                          }}
                          data-component-name="SingleDayView"
                        >
                          {user.initial}
                        </div>
                      )}
                      
                      <div className="p-1 pt-4 pl-2 h-full flex flex-col overflow-hidden" style={{ zIndex: 10 }} data-component-name="SingleDayView">
                        <div className="flex flex-wrap items-start max-w-full" data-component-name="SingleDayView">
                          <span className="text-[13px] font-bold leading-tight break-words" style={{ color: user.color }} data-component-name="SingleDayView">
                            {block.label}
                            <br />
                            {"(All Day)"}
                          </span>
                          {user.name === currentUserName && (
                            <Edit2 className="h-3 w-3 ml-1 flex-shrink-0" style={{ color: user.color }} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  });
                
                // Regular time blocks
                const regularBlocks = userBlocks
                  .filter(block => !block.allDay)
                  .sort((a, b) => {
                    // Sort blocks by start time to ensure the first block is at the top
                    const aStart = calculateBlockPosition(a.start);
                    const bStart = calculateBlockPosition(b.start);
                    return aStart - bStart;
                  })
                  .map((block, blockIndex) => {
                    const startPosition = calculateBlockPosition(block.start);
                    const endPosition = calculateBlockPosition(block.end);
                    const isFirstBlock = blockIndex === 0; // Check if this is the first block for this user
                    
                    return (
                      <div 
                        key={`block-${block.id || `${day}-${user.id}-${blockIndex}`}`}
                        className={`absolute rounded-md shadow-md border border-gray-700 transition-all duration-200 ${user.name === currentUserName ? 'cursor-pointer hover:brightness-110 active:brightness-90' : 'cursor-default'}`}
                        style={{
                          top: `${startPosition}%`,
                          height: `${endPosition - startPosition}%`,
                          left: `${leftPosition + columnWidth * 0.005}%`,
                          width: `${columnWidth * 0.99}%`,
                          backgroundColor: user.color,
                          zIndex: 20,
                        }}
                        onClick={() => onBlockClick(user, day, block)}
                        title={`${user.name}: ${block.label} (${block.start} - ${block.end})`}
                        data-component-name="SingleDayView"
                      >
                        {/* User initial centered on top of the block - only shown for the first block */}
                        {isFirstBlock && (
                          <div 
                            className="absolute -top-3 left-1/2 transform -translate-x-1/2 rounded-full flex items-center justify-center w-6 h-6 text-xs font-bold shadow-md border border-gray-700 z-50"
                            style={{
                              backgroundColor: user.color,
                              color: getTextColor(user.color),
                            }}
                            data-component-name="SingleDayView"
                          >
                            {user.initial}
                          </div>
                        )}
                        
                        <div className={`p-1 ${isFirstBlock ? 'pt-4' : 'pt-2'} pl-3 h-full flex flex-col overflow-hidden`} style={{ zIndex: 10 }} data-component-name="SingleDayView">
                          <div className="flex flex-col items-start justify-start w-full overflow-hidden" data-component-name="SingleDayView">
                            <span className="text-[13px] opacity-80 mb-0 mt-1 font-semibold leading-tight whitespace-nowrap" style={{ color: getTextColor(user.color) }} data-component-name="SingleDayView">
                              {formatTime(block.start)} - {formatTime(block.end)}
                            </span>
                            <div className="flex flex-wrap items-start max-w-full">
                              <span className="text-[13px] font-semibold leading-tight break-words" style={{ color: getTextColor(user.color) }} data-component-name="SingleDayView">
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
