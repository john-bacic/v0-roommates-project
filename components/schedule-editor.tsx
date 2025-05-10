"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TimeInput } from "@/components/ui/time-input"
import { TimePickerDialog } from "@/components/ui/time-picker-dialog"
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSwipe } from "@/hooks/use-swipe"

interface TimeBlock {
  id?: string
  start: string
  end: string
  label: string
  allDay?: boolean
}

interface ScheduleEditorProps {
  schedule: {activeDay: string, [key: string]: any}
  onChange: (schedule: {activeDay: string, [key: string]: any}) => void
  userColor: string
  onSave?: () => void
  use24HourFormat?: boolean
  userName?: string
}

export function ScheduleEditor({ schedule, onChange, userColor, onSave, use24HourFormat = false, userName }: ScheduleEditorProps) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const activeDay = schedule.activeDay as string

  // Time picker dialog state
  const [timePickerOpen, setTimePickerOpen] = useState(false)
  const [currentTimeField, setCurrentTimeField] = useState<{dayName: string, index: number, field: 'start' | 'end', label?: string} | null>(null)
  const [currentTimeValue, setCurrentTimeValue] = useState('')
  const [startTimeDialogKey, setStartTimeDialogKey] = useState(0)
  const [endTimeDialogKey, setEndTimeDialogKey] = useState(0)

  const [focusRingColor, setFocusRingColor] = useState(userColor)

  useEffect(() => {
    setFocusRingColor(userColor)

    document.documentElement.style.setProperty("--focus-ring-color", userColor)
  }, [userColor])
  
  // State to track the All Day toggle independently from the schedule data
  const [isAllDay, setIsAllDay] = useState(false);
  
  // Effect to update the isAllDay state when the schedule changes
  useEffect(() => {
    if (schedule[activeDay]?.length > 0) {
      const allDayValue = Boolean(schedule[activeDay][0].allDay);
      setIsAllDay(allDayValue);
    }
  }, [schedule, activeDay]);
  
  useEffect(() => {
    if (use24HourFormat) {
      document.documentElement.classList.add('use-24h-time')
    } else {
      document.documentElement.classList.remove('use-24h-time')
    }
    
    const timeInputs = document.querySelectorAll('input[type="time"]')
    timeInputs.forEach(input => {
      const htmlInput = input as HTMLInputElement
      const currentValue = htmlInput.value
      htmlInput.setAttribute('data-time-format', use24HourFormat ? '24h' : '12h')
      const tempValue = currentValue === '00:00' ? '00:01' : '00:00'
      htmlInput.value = tempValue
      htmlInput.value = currentValue
    })
  }, [use24HourFormat])

  const getTextColor = (bgColor: string) => {
    const lightColors = ["#BB86FC", "#03DAC6", "#FFB74D", "#64B5F6", "#81C784", "#FFD54F"]
    return lightColors.includes(bgColor) ? "#000" : "#fff"
  }

  const addTimeBlock = async () => {
    // Find the last time block for the active day to use its end time as the start time for the new block
    let startTime = "09:00";
    let endTime = "13:00"; // Default end time (4 hours after default start)
    
    const existingBlocks = schedule[activeDay] || [];
    
    if (existingBlocks.length > 0) {
      // Find the latest end time from existing blocks
      let latestEndTime = "00:00";
      
      for (const block of existingBlocks) {
        // Skip all-day events when determining latest end time
        if (block.allDay) continue;
        
        if (block.end > latestEndTime) {
          latestEndTime = block.end;
        }
      }
      
      if (latestEndTime !== "00:00") {
        // Use the latest end time as the start time for the new block
        startTime = latestEndTime;
        
        // Calculate end time (4 hours later)
        const [endHourStr, endMinuteStr] = latestEndTime.split(':');
        let endHour = parseInt(endHourStr, 10) + 4;
        const endMinute = endMinuteStr;
        
        // Handle day overflow
        if (endHour >= 24) {
          endHour = 23;
        }
        
        endTime = `${endHour.toString().padStart(2, '0')}:${endMinute}`;
      }
    }
    
    // Make sure the blocks are sorted by start time
    const newBlock: TimeBlock = { start: startTime, end: endTime, label: "", allDay: false };
    
    // Add the new block to the schedule
    const newSchedule = { ...schedule };
    newSchedule[activeDay] = [...(newSchedule[activeDay] || [])];
    newSchedule[activeDay].push(newBlock);
    
    // Sort time blocks by start time (earliest first)
    newSchedule[activeDay].sort((a: TimeBlock, b: TimeBlock) => {
      // Keep all-day events at the top
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.allDay && b.allDay) return 0;
      
      // Sort by start time for non-all-day events
      return a.start.localeCompare(b.start);
    });
    
    // Update the schedule
    onChange(newSchedule);
    
    // Save to Supabase immediately if we have a userName
    if (userName) {
      try {
        // Get user ID from Supabase
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('name', userName)
          .single();
        
        if (userError) {
          console.error('Error fetching user ID:', userError);
          return;
        }
        
        const userId = userData.id;
        
        // Insert the new block
        const { data: insertData, error: insertError } = await supabase
          .from('schedules')
          .insert({
            user_id: userId,
            day: activeDay,
            start_time: newBlock.start,
            end_time: newBlock.end,
            label: newBlock.label,
            all_day: newBlock.allDay || false
          })
          .select();
        
        if (insertError) {
          console.error('Error inserting schedule:', insertError);
        } else if (insertData && insertData.length > 0) {
          // Update the new block with the ID
          const index = newSchedule[activeDay].length - 1;
          newSchedule[activeDay][index].id = insertData[0].id;
          onChange(newSchedule);
        }
        
        // Save to localStorage as a fallback
        localStorage.setItem(`schedule_${userName}`, JSON.stringify(newSchedule));
      } catch (error) {
        console.error('Error saving schedule to Supabase:', error);
      }
    }
  }

  const handleScheduleChange = (day: string, blocks: TimeBlock[]) => {
    const newSchedule = { ...schedule }
    newSchedule[day] = blocks
    onChange(newSchedule)
  }
  
  const setActiveDay = (day: string) => {
    const newSchedule = { ...schedule, activeDay: day }
    onChange(newSchedule)
  }

  const updateTimeBlock = async (dayName: string, index: number, field: keyof TimeBlock, value: any) => {
    const newSchedule = { ...schedule }
    newSchedule[dayName] = [...(newSchedule[dayName] || [])]
    
    // Ensure allDay is properly stored as a boolean
    if (field === 'allDay') {
      value = Boolean(value)
    }
    
    // Create the updated block
    const updatedBlock = {
      ...newSchedule[dayName][index],
      [field]: value,
    }
    
    // If we're updating a time field, make sure start is before end
    if (field === 'start' || field === 'end') {
      const startTime = field === 'start' ? value : updatedBlock.start
      const endTime = field === 'end' ? value : updatedBlock.end
      
      // If start time is after end time, adjust the end time to be after start time
      if (startTime > endTime) {
        // Calculate a new end time (1 hour after start time)
        const [startHour, startMinute] = startTime.split(':').map(Number)
        let endHour = startHour + 1
        const endMinute = startMinute
        
        // Handle day overflow
        if (endHour >= 24) {
          endHour = 23
        }
        
        updatedBlock.end = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
      }
    }
    
    newSchedule[dayName][index] = updatedBlock
    
    // Sort time blocks by start time (earliest first)
    newSchedule[dayName].sort((a: TimeBlock, b: TimeBlock) => {
      // Keep all-day events at the top
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.allDay && b.allDay) return 0;
      
      // Sort by start time for non-all-day events
      return a.start.localeCompare(b.start);
    });
    
    onChange(newSchedule)
    
    // Save to Supabase immediately if we have a userName
    if (userName) {
      try {
        // Get user ID from Supabase
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('name', userName)
          .single();
        
        if (userError) {
          console.error('Error fetching user ID:', userError);
          return;
        }
        
        const userId = userData.id;
        const block = newSchedule[dayName][index];
        
        // If the block has an ID, update it
        if (block.id) {
          const { error: updateError } = await supabase
            .from('schedules')
            .update({
              start_time: block.start,
              end_time: block.end,
              label: block.label,
              all_day: Boolean(block.allDay)
            })
            .eq('id', block.id);
          
          if (updateError) {
            console.error('Error updating schedule:', updateError);
          }
        } else {
          // Otherwise, insert a new record
          const { data: insertData, error: insertError } = await supabase
            .from('schedules')
            .insert({
              user_id: userId,
              day: dayName,
              start_time: block.start,
              end_time: block.end,
              label: block.label,
              all_day: Boolean(block.allDay)
            })
            .select();
          
          if (insertError) {
            console.error('Error inserting schedule:', insertError);
          } else if (insertData && insertData.length > 0) {
            // Update the block with the new ID
            newSchedule[dayName][index].id = insertData[0].id;
            onChange(newSchedule);
          }
        }
        
        // Save to localStorage as a fallback
        localStorage.setItem(`schedule_${userName}`, JSON.stringify(newSchedule));
      } catch (error) {
        console.error('Error saving schedule to Supabase:', error);
      }
    }
  }

  const removeTimeBlock = async (dayName: string, index: number) => {
    const newSchedule = { ...schedule }
    newSchedule[dayName] = [...(newSchedule[dayName] || [])]
    const blockToRemove = newSchedule[dayName][index]
    
    // Remove the block
    newSchedule[dayName].splice(index, 1)
    
    // Re-sort the remaining blocks to maintain order
    newSchedule[dayName].sort((a: TimeBlock, b: TimeBlock) => {
      // Keep all-day events at the top
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.allDay && b.allDay) return 0;
      
      // Sort by start time for non-all-day events
      return a.start.localeCompare(b.start);
    });
    
    // Update the schedule
    onChange(newSchedule)
    
    // Delete from Supabase if we have an ID and userName
    if (blockToRemove && blockToRemove.id && userName) {
      try {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', blockToRemove.id);
        
        if (deleteError) {
          console.error('Error deleting schedule:', deleteError);
        }
        
        // Save to localStorage as a fallback
        localStorage.setItem(`schedule_${userName}`, JSON.stringify(newSchedule));
      } catch (error) {
        console.error('Error deleting schedule from Supabase:', error);
      }
    }
  }

  // Create a ref for the schedule content area for swipe detection
  const scheduleContentRef = useRef<HTMLDivElement>(null);
  const originalTimesRef = useRef<{ [key: string]: { start: string; end: string; label?: string } }>({});
  
  // Navigate to the previous day
  const goToPreviousDay = () => {
    const currentIndex = days.indexOf(activeDay);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : days.length - 1;
    setActiveDay(days[prevIndex]);
  };
  
  // Navigate to the next day
  const goToNextDay = () => {
    const currentIndex = days.indexOf(activeDay);
    const nextIndex = currentIndex < days.length - 1 ? currentIndex + 1 : 0;
    setActiveDay(days[nextIndex]);
  };
  
  // Initialize swipe handlers
  useSwipe(scheduleContentRef, {
    onSwipeLeft: goToNextDay,
    onSwipeRight: goToPreviousDay
  });
  
  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input elements are focused
      if (document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
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
  }, [activeDay]);
  
  return (
    <div className="w-full">

      <div className="bg-[#333333] rounded-lg p-4" ref={scheduleContentRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" data-component-name="ScheduleEditor">{activeDay}'s Schedule</h3>
          
          {schedule[activeDay]?.length > 0 && schedule[activeDay][0] && (
            <div className="flex items-center gap-3" data-component-name="ScheduleEditor">
              <Label htmlFor="all-day-toggle-0" className="cursor-pointer order-1">
                <span data-component-name="ScheduleEditor">All Day</span>
              </Label>
              <Switch
                id="all-day-toggle-0"
                key={`all-day-toggle-${activeDay}-${isAllDay}`}
                checked={isAllDay}
                data-component-name="Primitive.button"
                className="order-2 data-[state=checked]:bg-[var(--focus-ring-color)] data-[state=unchecked]:bg-black h-7 w-12 px-[3px]"
                style={{
                  '--switch-thumb-color': '#333333'
                } as React.CSSProperties}
                data-allday={isAllDay.toString()}
                onCheckedChange={(checked) => {
                  // Update our local state immediately
                  setIsAllDay(checked);
                  const key = `${activeDay}-0`;
                  const newSchedule = { ...schedule };
                  if (!newSchedule[activeDay]) newSchedule[activeDay] = [];
                  
                  if (checked) {
                    // Store original times and label
                    originalTimesRef.current[key] = { 
                      start: schedule[activeDay][0].start || "09:00", 
                      end: schedule[activeDay][0].end || "17:00",
                      label: schedule[activeDay][0].label // Store the original label
                    };
                    // Update block with all day values
                    newSchedule[activeDay][0] = {
                      ...schedule[activeDay][0],
                      allDay: true,
                      start: "00:00",
                      end: "23:59",
                      label: "Day Off" // Always set to Day Off when toggling to All Day
                    };
                  } else {
                    // Restore original times
                    const prev = originalTimesRef.current[key] || { start: "09:00", end: "17:00" };
                    // Update block with original values
                    newSchedule[activeDay][0] = {
                      ...schedule[activeDay][0],
                      allDay: false,
                      start: prev.start,
                      end: prev.end,
                      label: prev.label || "Work" // Restore original label or default to "Work"
                    };
                    delete originalTimesRef.current[key];
                  }
                  
                  // Update UI immediately
                  onChange(newSchedule);
                  
                  // Then persist to Supabase
                  updateTimeBlock(activeDay, 0, "allDay", checked);
                  if (checked) {
                    updateTimeBlock(activeDay, 0, "start", "00:00");
                    updateTimeBlock(activeDay, 0, "end", "23:59");
                    // Always set label to "Day Off" when toggling to All Day
                    updateTimeBlock(activeDay, 0, "label", "Day Off");
                  } else {
                    const prev = originalTimesRef.current[key] || { start: "09:00", end: "17:00" };
                    updateTimeBlock(activeDay, 0, "start", prev.start);
                    updateTimeBlock(activeDay, 0, "end", prev.end);
                    // Restore original label or default to "Work"
                    updateTimeBlock(activeDay, 0, "label", prev.label || "Work");
                  }
                }}
              />
            </div>
          )}
        </div>

        {schedule[activeDay]?.length === 0 && (
          <p className="text-sm text-[#A0A0A0] mb-4">No scheduled times for this day.</p>
        )}

        {/* Separator above time blocks */}
        {schedule[activeDay] && schedule[activeDay].length > 0 && (
          <div className="h-[1px] bg-[#555555] w-full mb-4 mt-2"></div>
        )}
        
        {[...(schedule[activeDay] || [])]
          .sort((a, b) => {
            // Sort by start time (all-day events first, then by start time)
            if (a.allDay && !b.allDay) return -1;
            if (!a.allDay && b.allDay) return 1;
            if (a.allDay && b.allDay) return 0;
            
            // Convert time strings to comparable values
            const aTime = a.start.split(':').map(Number);
            const bTime = b.start.split(':').map(Number);
            
            // Compare hours first
            if (aTime[0] !== bTime[0]) return aTime[0] - bTime[0];
            
            // If hours are the same, compare minutes
            return aTime[1] - bTime[1];
          })
          .map((block, index) => (
          <div key={index} className={`mb-4 ${block.allDay === true ? 'rounded-md p-3 relative border-2' : 'p-3 rounded-md'}`} 
            style={{
              borderColor: block.allDay === true ? userColor : 'transparent',
              backgroundImage: block.allDay === true ? `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.3) 5px, rgba(0,0,0,0.3) 10px)` : 'none',
              backgroundColor: block.allDay === true ? 'transparent' : '#333333',
              color: block.allDay === true ? userColor : 'inherit'
            }}
            data-component-name="ScheduleEditor">
            {index > 0 && <div className="h-[1px] bg-[#555555] w-full mb-4 mt-2"></div>}
            {/* Removed the absolute positioned All Day label */}
            
            {/* Time Fields - Only shown when All Day is OFF */}
            {!block.allDay && (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col">
                  <Label htmlFor={`start-${index}`} className="text-xs mb-1 block">Start</Label>
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      // Force immediate synchronization of start time values only
                      setCurrentTimeField({dayName: activeDay, index, field: 'start', label: block.label})
                      setCurrentTimeValue(block.start || '09:00')
                      setStartTimeDialogKey(prev => prev + 1) // Increment start time dialog key
                      setTimePickerOpen(true)
                    }}
                  >
                    <TimeInput
                      id={`start-${index}`}
                      value={block.start || ''}
                      onChange={(value) => updateTimeBlock(activeDay, index, "start", value)}
                      use24HourFormat={use24HourFormat}
                      userColor={userColor}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <Label htmlFor={`end-${index}`} className="text-xs mb-1 block">End</Label>
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      // Force immediate synchronization of end time values only
                      setCurrentTimeField({dayName: activeDay, index, field: 'end', label: block.label})
                      setCurrentTimeValue(block.end || '17:00')
                      setEndTimeDialogKey(prev => prev + 1) // Increment end time dialog key
                      setTimePickerOpen(true)
                    }}
                  >
                    <TimeInput
                      id={`end-${index}`}
                      value={block.end || ''}
                      onChange={(value) => updateTimeBlock(activeDay, index, "end", value)}
                      use24HourFormat={use24HourFormat}
                      userColor={userColor}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Label Field and Remove Button */}
            <div className="grid grid-cols-12 gap-1 items-end">
              <div className="col-span-11 pr-0">
                <Label htmlFor={`label-${index}`} className="text-xs mb-1 block">
                  Label
                </Label>
                <div className="relative">
                  <Input
                    id={`label-${index}`}
                    type="text"
                    value={block.label !== undefined ? block.label : ''}
                    onChange={(e) => updateTimeBlock(activeDay, index, "label", e.target.value)}
                    className={`${block.allDay === true ? 'bg-[#333333] border-[#333333] text-white font-medium' : 'bg-[#242424] border-[#333333] text-white'} h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:border-[var(--focus-ring-color)]`}
                    placeholder={block.allDay ? "Day Off, Busy, etc." : "Work, Class, etc."}
                    data-component-name="_c"
                    data-label-index={index}
                  />
                  {block.allDay === true && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium px-1 py-1 " 
                      style={{ color: userColor }}
                      data-component-name="ScheduleEditor"
                    >
                      All Day
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-1 pl-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTimeBlock(activeDay, index)}
                  className="h-10 w-10 text-[#FF80AB] hover:text-[#FF80AB] hover:bg-[#242424]"
                  data-delete-for={`label-${index}`}
                  aria-label={`Delete ${block.label || (block.allDay ? 'Day Off' : 'Work')} time block`}
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Always show instructional text */}
        <p className="text-sm text-[#A0A0A0] mb-4" data-component-name="ScheduleEditor">
          {schedule[activeDay]?.length > 0 && schedule[activeDay][0]?.allDay 
            ? "Add time blocks for specific activities (will overlap with All Day)"
            : "Add multiple time blocks to create breaks between activities"}
        </p>
        
        {/* Always show Add block button */}
        <div className="flex justify-center mt-2 w-full">
          <button
            onClick={addTimeBlock}
            className="w-full px-6 py-2 h-10 text-sm border-2 rounded-md font-medium"
            style={{ 
              backgroundColor: "#333333", 
              color: userColor, 
              borderColor: userColor 
            }}
            data-dark-bg="true"
            data-component-name="ScheduleEditor"
          >
            + Add time
          </button>
        </div>
      </div>

      {/* Time Picker Dialog */}
      <TimePickerDialog
        key={currentTimeField?.field === 'start' ? `start-time-${startTimeDialogKey}` : `end-time-${endTimeDialogKey}`}
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        initialTime={currentTimeValue}
        onTimeSelect={(newTime) => {
          if (currentTimeField) {
            updateTimeBlock(currentTimeField.dayName, currentTimeField.index, currentTimeField.field, newTime)
          }
        }}
        use24HourFormat={use24HourFormat}
        userColor={userColor}
        title={currentTimeField?.field === 'start' ? 'Start Time' : 'End Time'}
        label={currentTimeField?.label}
      />
    </div>
  )
}
