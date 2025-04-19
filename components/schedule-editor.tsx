"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"

interface TimeBlock {
  start: string
  end: string
  label: string
  allDay?: boolean
}

// Update the interface to accept userColor prop
interface ScheduleEditorProps {
  schedule: Record<string, TimeBlock[]>
  onChange: (schedule: Record<string, TimeBlock[]>) => void
  userColor?: string
  onSave?: () => void
}

// Update the component to use the userColor prop
export function ScheduleEditor({ schedule, onChange, userColor = "#BB86FC", onSave }: ScheduleEditorProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [activeDay, setActiveDay] = useState(days[0])

  // Add state to track focus ring color
  const [focusRingColor, setFocusRingColor] = useState(userColor)

  // Update focus ring color when userColor changes
  useEffect(() => {
    setFocusRingColor(userColor)

    // Update CSS variable for focus styles
    document.documentElement.style.setProperty("--focus-ring-color", userColor)
  }, [userColor])

  // Helper function to determine text color based on background color
  const getTextColor = (bgColor: string) => {
    const lightColors = ["#BB86FC", "#03DAC6", "#FFB74D", "#64B5F6", "#81C784", "#FFD54F"]
    return lightColors.includes(bgColor) ? "#000" : "#fff"
  }

  const addTimeBlock = () => {
    const newSchedule = { ...schedule }
    newSchedule[activeDay] = [...(newSchedule[activeDay] || []), { start: "09:00", end: "12:00", label: "Work", allDay: false }]
    onChange(newSchedule)
  }

  const updateTimeBlock = (dayName: string, index: number, field: keyof TimeBlock, value: any) => {
    const newSchedule = { ...schedule }
    newSchedule[dayName] = [...(newSchedule[dayName] || [])]
    newSchedule[dayName][index] = {
      ...newSchedule[dayName][index],
      [field]: value,
    }
    onChange(newSchedule)
  }

  const removeTimeBlock = (dayName: string, index: number) => {
    const newSchedule = { ...schedule }
    newSchedule[dayName] = [...(newSchedule[dayName] || [])]
    newSchedule[dayName].splice(index, 1)
    onChange(newSchedule)
  }

  return (
    <div className="w-full">
      <div className="flex overflow-x-auto mb-4 pb-2">
        {days.map((day) => (
          <Button
            key={day}
            variant={activeDay === day ? "default" : "outline"}
            className={`mr-2 ${
              activeDay === day ? "text-black" : "bg-[#333333] border-[#444444] text-white hover:bg-[#444444]"
            }`}
            style={activeDay === day ? { backgroundColor: userColor, color: getTextColor(userColor) } : {}}
            onClick={() => setActiveDay(day)}
          >
            {day.substring(0, 3)}
          </Button>
        ))}
      </div>

      <div className="bg-[#1E1E1E] rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">{activeDay}'s Schedule</h3>

        {schedule[activeDay]?.length === 0 && (
          <p className="text-sm text-[#A0A0A0] mb-4">No scheduled times for this day.</p>
        )}

        {schedule[activeDay]?.length > 0 && (
          <p className="text-sm text-[#A0A0A0] mb-4">Add multiple time blocks to create breaks between activities</p>
        )}

        {schedule[activeDay]?.map((block, index) => (
          <div key={index} className="mb-4">
            {/* iOS Toggle Switch - Exact Match */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">All Day</div>
              
              {/* iOS-style toggle that matches the screenshot */}
              <label 
                htmlFor={`all-day-toggle-${index}`}
                className="relative inline-block w-12 h-6 rounded-full cursor-pointer"
                style={{ 
                  backgroundColor: block.allDay ? '#4CD964' : '#404040',
                  transition: 'background-color 0.3s'
                }}
                onClick={(e) => {
                  // Prevent default to handle toggle ourselves
                  e.preventDefault();
                  
                  // Copy the current schedule
                  const newSchedule = {...schedule};
                  if (!newSchedule[activeDay]) newSchedule[activeDay] = [];
                  
                  // Get current block with all required TimeBlock properties
                  const currentBlock = newSchedule[activeDay][index] || {
                    start: block.start || "09:00",
                    end: block.end || "17:00",
                    label: block.label || ""
                  };
                  
                  // Toggle the allDay state
                  const newAllDay = !currentBlock.allDay;
                  
                  // Update the block
                  newSchedule[activeDay][index] = {
                    ...currentBlock,
                    allDay: newAllDay,
                    // If turning on all day, set to full day
                    start: newAllDay ? "00:00" : currentBlock.start,
                    end: newAllDay ? "23:59" : currentBlock.end
                  };
                  
                  // Apply the update
                  onChange(newSchedule);
                }}
              >
                <input 
                  id={`all-day-toggle-${index}`}
                  type="checkbox"
                  className="sr-only"
                  checked={block.allDay || false}
                  readOnly // controlled by the onClick handler on the label
                />
                <div 
                  className="absolute w-5 h-5 bg-white rounded-full shadow-md" 
                  style={{
                    top: '2px',
                    left: block.allDay ? '25px' : '2px',
                    transition: 'left 0.3s'
                  }}
                />
              </label>
            </div>
            
            {/* Time Fields - Only shown when All Day is OFF */}
            {!block.allDay && (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col">
                  <Label htmlFor={`start-${index}`} className="text-xs mb-1">
                    Start Time
                  </Label>
                  <Input
                    id={`start-${index}`}
                    type="time"
                    value={block.start || ''}
                    className="bg-[#242424] border-[#333333] text-white"
                    onChange={(e) => updateTimeBlock(activeDay, index, "start", e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor={`end-${index}`} className="text-xs mb-1">
                    End Time
                  </Label>
                  <Input
                    id={`end-${index}`}
                    type="time"
                    value={block.end || ''}
                    className="bg-[#242424] border-[#333333] text-white"
                    onChange={(e) => updateTimeBlock(activeDay, index, "end", e.target.value)}
                  />
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

        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button
            onClick={onSave || (() => window.location.href = "/dashboard")}
            style={{ backgroundColor: userColor, color: getTextColor(userColor) }}
            className="hover:opacity-90 w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
              <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
              <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
              <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
            </svg>
            Save
          </Button>
          <Button
            onClick={addTimeBlock}
            className="w-full sm:w-auto text-white px-4 py-2 h-10 text-sm"
            style={{ backgroundColor: userColor, color: getTextColor(userColor) }}
          >
            +ADD
          </Button>
        </div>
      </div>
    </div>
  )
}
