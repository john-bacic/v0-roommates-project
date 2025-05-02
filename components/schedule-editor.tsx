"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TimeInput } from "@/components/ui/time-input"
import { TimePickerDialog } from "@/components/ui/time-picker-dialog"
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
  schedule: Record<string, TimeBlock[]>
  onChange: (schedule: Record<string, TimeBlock[]>) => void
  userColor?: string
  onSave?: () => void
  use24HourFormat?: boolean
  userName?: string
  initialActiveDay?: string
}

export function ScheduleEditor({ schedule, onChange, userColor = "#BB86FC", onSave, use24HourFormat = true, userName, initialActiveDay }: ScheduleEditorProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [activeDay, setActiveDay] = useState(initialActiveDay || days[0])

  // Time picker dialog state
  const [timePickerOpen, setTimePickerOpen] = useState(false)
  const [currentTimeField, setCurrentTimeField] = useState<{dayName: string, index: number, field: 'start' | 'end'} | null>(null)
  const [currentTimeValue, setCurrentTimeValue] = useState('')

  const [focusRingColor, setFocusRingColor] = useState(userColor)

  useEffect(() => {
    setFocusRingColor(userColor)

    document.documentElement.style.setProperty("--focus-ring-color", userColor)
  }, [userColor])
  
  // Update activeDay when initialActiveDay changes
  useEffect(() => {
    if (initialActiveDay && days.includes(initialActiveDay)) {
      setActiveDay(initialActiveDay)
    }
  }, [initialActiveDay])
  
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
    const newBlock = { start: "09:00", end: "12:00", label: "Work", allDay: false };
    const newSchedule = { ...schedule }
    newSchedule[activeDay] = [...(newSchedule[activeDay] || []), newBlock]
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

  const updateTimeBlock = async (dayName: string, index: number, field: keyof TimeBlock, value: any) => {
    const newSchedule = { ...schedule }
    newSchedule[dayName] = [...(newSchedule[dayName] || [])]
    newSchedule[dayName][index] = {
      ...newSchedule[dayName][index],
      [field]: value,
    }
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
              all_day: block.allDay || false
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
              all_day: block.allDay || false
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
    const block = schedule[dayName][index];
    const newSchedule = { ...schedule }
    newSchedule[dayName] = [...(newSchedule[dayName] || [])]
    newSchedule[dayName].splice(index, 1)
    onChange(newSchedule)
    
    // Delete from Supabase if we have an ID and userName
    if (block.id && userName) {
      try {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', block.id);
        
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
  const originalTimesRef = useRef<{ [key: string]: { start: string; end: string } }>({});
  
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
      <div className="grid grid-cols-7 gap-1 mb-4 pb-2 w-full" role="tablist" aria-label="Day selector">
        {days.map((day) => {
          const isActive = activeDay === day;
          const dayIndex = days.indexOf(day);
          const prevDay = dayIndex > 0 ? days[dayIndex - 1] : days[days.length - 1];
          const nextDay = dayIndex < days.length - 1 ? days[dayIndex + 1] : days[0];
          
          return (
            <Button
              key={day}
              variant={isActive ? "default" : "outline"}
              className={`px-1 sm:px-2 text-xs sm:text-sm ${
                isActive ? "text-black" : "bg-[#333333] border-[#444444] text-white hover:bg-[#444444]"
              }`}
              style={isActive ? { backgroundColor: userColor, color: getTextColor(userColor) } : {}}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${day.toLowerCase()}-panel`}
              onClick={() => setActiveDay(day)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setActiveDay(prevDay);
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  setActiveDay(nextDay);
                }
              }}
              onDoubleClick={() => {
                // On double click, go to next day
                const nextIndex = days.indexOf(day) < days.length - 1 ? days.indexOf(day) + 1 : 0;
                setActiveDay(days[nextIndex]);
              }}
              onTouchStart={(e) => {
                // Track touch for potential double-tap
                const touchTarget = e.currentTarget;
                const lastTouch = touchTarget.getAttribute('data-last-touch') || '0';
                const now = new Date().getTime();
                const timeSince = now - parseInt(lastTouch);
                
                if (timeSince < 300 && timeSince > 0) {
                  // Double tap detected
                  e.preventDefault();
                  const nextIndex = days.indexOf(day) < days.length - 1 ? days.indexOf(day) + 1 : 0;
                  setActiveDay(days[nextIndex]);
                }
                
                touchTarget.setAttribute('data-last-touch', now.toString());
              }}
              // Allow long-press to go to previous day
              onContextMenu={(e) => {
                e.preventDefault();
                const prevIndex = days.indexOf(day) > 0 ? days.indexOf(day) - 1 : days.length - 1;
                setActiveDay(days[prevIndex]);
              }}
              tabIndex={0}
              aria-label={`${day} tab${isActive ? ', selected' : ''}`}
            >
              {day.substring(0, 3)}
            </Button>
          );
        })}
      </div>

      <div className="bg-[#333333] rounded-lg p-4" ref={scheduleContentRef}>
        <div className="flex items-center mb-4">
          <h3 className="text-sm font-medium">{activeDay}'s Schedule</h3>
        </div>

        {schedule[activeDay]?.length === 0 && (
          <p className="text-sm text-[#A0A0A0] mb-4">No scheduled times for this day.</p>
        )}

        {schedule[activeDay]?.length > 0 && (
          <p className="text-sm text-[#A0A0A0] mb-4">Add multiple time blocks to create breaks between activities</p>
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
          <div key={index} className="mb-4">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between mb-3">
              <Label htmlFor={`all-day-toggle-${index}`} className="cursor-pointer">
                <span>All Day</span>
              </Label>
              <Switch
                id={`all-day-toggle-${index}`}
                checked={block.allDay || false}
                onCheckedChange={(checked) => {
                  const key = `${activeDay}-${index}`;
                  const newSchedule = { ...schedule };
                  if (!newSchedule[activeDay]) newSchedule[activeDay] = [];
                  
                  if (checked) {
                    // Store original times
                    originalTimesRef.current[key] = { start: block.start || "09:00", end: block.end || "17:00" };
                    // Update block with all day values
                    newSchedule[activeDay][index] = {
                      ...block,
                      allDay: true,
                      start: "00:00",
                      end: "23:59"
                    };
                  } else {
                    // Restore original times
                    const prev = originalTimesRef.current[key] || { start: "09:00", end: "17:00" };
                    // Update block with original values
                    newSchedule[activeDay][index] = {
                      ...block,
                      allDay: false,
                      start: prev.start,
                      end: prev.end
                    };
                    delete originalTimesRef.current[key];
                  }
                  
                  // Update UI immediately
                  onChange(newSchedule);
                  
                  // Then persist to Supabase
                  updateTimeBlock(activeDay, index, "allDay", checked);
                  if (checked) {
                    updateTimeBlock(activeDay, index, "start", "00:00");
                    updateTimeBlock(activeDay, index, "end", "23:59");
                  } else {
                    const prev = originalTimesRef.current[key] || { start: "09:00", end: "17:00" };
                    updateTimeBlock(activeDay, index, "start", prev.start);
                    updateTimeBlock(activeDay, index, "end", prev.end);
                  }
                }}
                className="data-[state=checked]:bg-[var(--focus-ring-color)]"
              />
            </div>
            
            {/* Time Fields - Only shown when All Day is OFF */}
            {!block.allDay && (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col">
                  <Label htmlFor={`start-${index}`} className="text-xs mb-1 block">Start</Label>
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      setCurrentTimeField({dayName: activeDay, index, field: 'start'})
                      setCurrentTimeValue(block.start || '09:00')
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
                      setCurrentTimeField({dayName: activeDay, index, field: 'end'})
                      setCurrentTimeValue(block.end || '17:00')
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
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-11">
                <Label htmlFor={`label-${index}`} className="text-xs mb-1 block">
                  Label
                </Label>
                <Input
                  id={`label-${index}`}
                  type="text"
                  value={block.label || ''}
                  onChange={(e) => updateTimeBlock(activeDay, index, "label", e.target.value)}
                  className="bg-[#242424] border-[#333333] text-white h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:border-[var(--focus-ring-color)]"
                  placeholder="Work, Class, etc."
                />
              </div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTimeBlock(activeDay, index)}
                  className="h-9 w-9 text-[#CF6679] hover:text-[#CF6679] hover:bg-[#242424]"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-center mt-2 w-full">
          <Button
            onClick={addTimeBlock}
            className="w-full px-6 py-2 h-10 text-sm border-2"
            style={{ backgroundColor: "#333333", color: userColor, borderColor: userColor }}
            data-dark-bg="true"
          >
            +ADD
          </Button>
        </div>
      </div>

      {/* Time Picker Dialog */}
      <TimePickerDialog
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
      />
    </div>
  )
}
