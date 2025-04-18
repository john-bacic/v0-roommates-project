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
}

// Update the interface to accept userColor prop
interface ScheduleEditorProps {
  schedule: Record<string, TimeBlock[]>
  onChange: (schedule: Record<string, TimeBlock[]>) => void
  userColor?: string
}

// Update the component to use the userColor prop
export function ScheduleEditor({ schedule, onChange, userColor = "#BB86FC" }: ScheduleEditorProps) {
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
    newSchedule[activeDay] = [...(newSchedule[activeDay] || []), { start: "09:00", end: "12:00", label: "Work" }]
    onChange(newSchedule)
  }

  const updateTimeBlock = (dayName: string, index: number, field: keyof TimeBlock, value: string) => {
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
          <div key={index} className="grid grid-cols-12 gap-2 mb-4 items-end">
            <div className="col-span-4">
              <Label htmlFor={`start-${index}`} className="text-xs mb-1 block">
                Start Time
              </Label>
              <Input
                id={`start-${index}`}
                type="time"
                value={block.start}
                onChange={(e) => updateTimeBlock(activeDay, index, "start", e.target.value)}
                className="bg-[#242424] border-[#333333] text-white h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:border-[var(--focus-ring-color)]"
              />
            </div>
            <div className="col-span-4">
              <Label htmlFor={`end-${index}`} className="text-xs mb-1 block">
                End Time
              </Label>
              <Input
                id={`end-${index}`}
                type="time"
                value={block.end}
                onChange={(e) => updateTimeBlock(activeDay, index, "end", e.target.value)}
                className="bg-[#242424] border-[#333333] text-white h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:border-[var(--focus-ring-color)]"
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`label-${index}`} className="text-xs mb-1 block">
                Label
              </Label>
              <Input
                id={`label-${index}`}
                type="text"
                value={block.label}
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
        ))}

        <Button
          onClick={addTimeBlock}
          className="w-full mt-2 text-white"
          style={{ backgroundColor: userColor, color: getTextColor(userColor) }}
        >
          Add Another Time Block
        </Button>
      </div>

      {/* Add custom styles for focus states */}
    </div>
  )
}
