"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TimeInput } from "@/components/ui/time-input"
import { Trash2 } from "lucide-react"

interface TimeBlock {
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
}

export function ScheduleEditor({ schedule, onChange, userColor = "#BB86FC", onSave, use24HourFormat = true }: ScheduleEditorProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const [activeDay, setActiveDay] = useState(days[0])

  const [focusRingColor, setFocusRingColor] = useState(userColor)

  useEffect(() => {
    setFocusRingColor(userColor)

    document.documentElement.style.setProperty("--focus-ring-color", userColor)
  }, [userColor])
  
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

      <div className="bg-[#333333] rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">{activeDay}'s Schedule</h3>

        {schedule[activeDay]?.length === 0 && (
          <p className="text-sm text-[#A0A0A0] mb-4">No scheduled times for this day.</p>
        )}

        {schedule[activeDay]?.length > 0 && (
          <p className="text-sm text-[#A0A0A0] mb-4">Add multiple time blocks to create breaks between activities</p>
        )}

        {schedule[activeDay]?.map((block, index) => (
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
                  const newSchedule = {...schedule};
                  if (!newSchedule[activeDay]) newSchedule[activeDay] = [];
                  
                  const currentBlock = newSchedule[activeDay][index] || {
                    start: block.start || "09:00",
                    end: block.end || "17:00",
                    label: block.label || ""
                  };
                  
                  newSchedule[activeDay][index] = {
                    ...currentBlock,
                    allDay: checked,
                    start: checked ? "00:00" : currentBlock.start,
                    end: checked ? "23:59" : currentBlock.end
                  };
                  
                  onChange(newSchedule);
                }}
                className="data-[state=checked]:bg-[var(--focus-ring-color)]"
              />
            </div>
            
            {/* Time Fields - Only shown when All Day is OFF */}
            {!block.allDay && (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col">
                  <TimeInput
                    id={`start-${index}`}
                    label="Start"
                    value={block.start || ''}
                    onChange={(value) => updateTimeBlock(activeDay, index, "start", value)}
                    use24HourFormat={use24HourFormat}
                  />
                </div>
                <div className="flex flex-col">
                  <TimeInput
                    id={`end-${index}`}
                    label="End"
                    value={block.end || ''}
                    onChange={(value) => updateTimeBlock(activeDay, index, "end", value)}
                    use24HourFormat={use24HourFormat}
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
            className="w-full sm:w-auto px-4 py-2 h-10 text-sm border-2"
            style={{ backgroundColor: getTextColor(userColor), color: userColor, borderColor: userColor }}
          >
            +ADD
          </Button>
        </div>
      </div>

    </div>
  )
}
