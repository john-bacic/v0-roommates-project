"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TimeInput } from "@/components/ui/time-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, Check, Palette, X } from "lucide-react"

// Update the TimeBlock interface to include allDay property
interface TimeBlock {
  id?: string
  start: string
  end: string
  label: string
  allDay?: boolean
}

interface QuickScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (day: string, timeBlock: TimeBlock) => void
  onDelete?: (day: string, timeBlockId: string) => void
  userName: string
  userColor: string
  initialDay?: string
  editMode?: boolean
  timeBlock?: TimeBlock
  usedColors?: string[]
  showColorPicker?: boolean
  setShowColorPicker?: (show: boolean) => void
  onUserColorChange?: (color: string) => void
  isColorPickerOnly?: boolean // New prop to show only color picker
  use24HourFormat?: boolean // New prop to control time format display
}

// Predefined colors for the color picker in a 3x3 grid - exact hex codes from image
const COLORS = [
  "#FF7DB1", // Top left - Hot Pink
  "#FFC7C1", // Top middle - Light Pink
  "#FF746A", // Top right - Coral
  "#FF9F21", // Middle left - Orange
  "#F8D667", // Middle middle - Yellow
  "#63D7C6", // Middle right - Mint
  "#89FA96", // Bottom left - Light Green
  "#8EBDFF", // Bottom middle - Sky Blue
  "#B388F5", // Bottom right - Lavender
]

// Helper function to format time for display (24h -> 12h with AM/PM)
function formatTimeForDisplay(time24h: string, use24Hour: boolean = false): string {
  if (use24Hour) {
    return time24h; // Return as is for 24-hour format
  }
  
  try {
    const [hours, minutes] = time24h.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12 // Convert 0 to 12 for 12 AM
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch (e) {
    return time24h // Fallback to original format if parsing fails
  }
}

export function QuickScheduleModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  userName,
  userColor: initialUserColor,
  initialDay = "Monday",
  editMode = false,
  timeBlock: initialTimeBlock,
  usedColors = [],
  onUserColorChange,
  isColorPickerOnly = false,
  use24HourFormat = true,
}: QuickScheduleModalProps) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const [day, setDay] = useState(initialDay)
  // Add state to track the current color within the modal
  const [currentColor, setCurrentColor] = useState(initialUserColor)

  // Update the initial state in the component to include allDay property
  const [timeBlock, setTimeBlock] = useState<TimeBlock>(() => {
    if (initialTimeBlock) {
      return {
        ...initialTimeBlock,
        // Ensure allDay is explicitly set to a boolean value
        allDay: initialTimeBlock.allDay === true,
      }
    }
    return {
      id: crypto.randomUUID(),
      start: "09:00",
      end: "17:00",
      label: "Work",
      allDay: false,
    }
  })
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Reset state when modal opens or userColor changes
  useEffect(() => {
    if (isOpen) {
      setCurrentColor(initialUserColor)
      setShowColorPicker(false)
      if (initialTimeBlock) {
        // Ensure allDay is explicitly set to a boolean value
        setTimeBlock({
          ...initialTimeBlock,
          allDay: initialTimeBlock.allDay === true,
        })
      } else {
        // Reset to default state with allDay explicitly set to false
        setTimeBlock({
          id: crypto.randomUUID(),
          start: "09:00",
          end: "17:00",
          label: "Work",
          allDay: false,
        })
      }
      setDay(initialDay)
    }
  }, [isOpen, initialTimeBlock, initialUserColor, initialDay])

  // Update CSS variable for focus styles
  useEffect(() => {
    document.documentElement.style.setProperty("--focus-ring-color", currentColor)
  }, [currentColor])
  
  // Apply time format class to document
  useEffect(() => {
    // Apply a CSS class to the document to control time input display
    if (use24HourFormat) {
      document.documentElement.classList.add('use-24h-time')
    } else {
      document.documentElement.classList.remove('use-24h-time')
    }
  }, [use24HourFormat])

  const handleSave = () => {
    onSave(day, timeBlock)
    onClose()
  }

  const handleDelete = () => {
    if (onDelete && timeBlock.id) {
      onDelete(day, timeBlock.id)
      onClose()
    } else if (onDelete) {
      // If there's no ID (which might be the case for newly created blocks),
      // we can still try to delete using a fallback approach
      console.log("Attempting to delete time block without ID")
      onDelete(day, "current")
    }
  }

  // Handle color change
  const handleColorChange = (newColor: string) => {
    setCurrentColor(newColor);
    // Only update the color, don't close the modal or affect schedules
    if (onUserColorChange) {
      // Pass the color as the first parameter to match the expected function signature
      onUserColorChange(newColor);
    }
    // In color-only mode, we want to keep the picker open
    // In regular mode, auto-close the color picker after selection
    if (!isColorPickerOnly && setShowColorPicker) {
      setShowColorPicker(false);
    }
    // Important: Don't call onClose() here to prevent losing schedule data
  }

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker)
  }

  // Add a function to toggle the all-day state
  const toggleAllDay = () => {
    setTimeBlock((prev) => ({
      ...prev,
      allDay: !prev.allDay,
    }))
  }

  // Helper function to always return dark text for colored backgrounds
  const getTextColor = (bgColor: string) => {
    return "#000" // Always use dark text against colored backgrounds
  }

  // Don't render if not open
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-[#333333] text-white border-[#333333] sm:max-w-[425px] w-full max-w-md mx-4 rounded-lg shadow-lg overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center p-6">
          <div className="flex items-center gap-3 justify-center w-full">
            <div
              className="flex justify-center items-center h-8 w-8 rounded-full text-sm relative"
              style={{ 
                backgroundColor: currentColor, 
                color: getTextColor(currentColor) 
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold leading-none tracking-tight">{userName}'s {isColorPickerOnly ? 'Color' : 'Schedule'}</h2>
          </div>
          <p className="text-sm text-gray-400 text-center">
            {isColorPickerOnly 
              ? 'Select your color preference below.'
              : 'Quickly add to your schedule for the selected day.'}
          </p>
        </div>

        {/* Show colors when showColorPicker OR isColorPickerOnly is true */}
        {(showColorPicker || isColorPickerOnly) && (
          <div className="mb-4 p-3 bg-[#242424] rounded-md">

            <div className="grid grid-cols-3 gap-4 mt-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-12 h-12 rounded-full transition-all hover:scale-110 mx-auto ${currentColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#242424]' : 'border border-[#333333]'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>

          </div>
        )}

        {/* Day Selector - Only show if not in color picker only mode */}
        {!isColorPickerOnly && (
          <div className="grid gap-2">
            <Label htmlFor="day">Day</Label>
            <Select defaultValue={day} onValueChange={setDay}>
              <SelectTrigger
                id="day"
                className="bg-[#242424] border-[#333333] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:border-[var(--focus-ring-color)]"
                style={{ backgroundColor: "#242424" }}
              >
                <SelectValue placeholder="Select Day" />
              </SelectTrigger>
              <SelectContent className="bg-[#242424] border-[#333333] text-white">
                {days.map((dayOption) => (
                  <SelectItem key={dayOption} value={dayOption}>
                    {dayOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* All Day Toggle - Only show if not in color picker only mode */}
        {!isColorPickerOnly && (
          <div className="flex items-center justify-between">
            <Label htmlFor="all-day" className="cursor-pointer">
              <span>All Day</span>
            </Label>
            <Switch
              id="all-day"
              checked={timeBlock.allDay}
              onCheckedChange={toggleAllDay}
              className="data-[state=checked]:bg-[var(--focus-ring-color)]"
            />
          </div>
        )}

        {/* Time Inputs - only show if not all day and not color picker only */}
        {!timeBlock.allDay && !isColorPickerOnly && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="relative">
                <TimeInput
                  id="start-time"
                  label="Start Time"
                  value={timeBlock.start}
                  onChange={(value) => setTimeBlock({ ...timeBlock, start: value })}
                  use24HourFormat={use24HourFormat}
                />
                <div className="absolute right-0 -top-5 text-xs text-[#A0A0A0]">
                  {formatTimeForDisplay(timeBlock.start, use24HourFormat)}
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="relative">
                <TimeInput
                  id="end-time"
                  label="End Time"
                  value={timeBlock.end}
                  onChange={(value) => setTimeBlock({ ...timeBlock, end: value })}
                  use24HourFormat={use24HourFormat}
                />
                <div className="absolute right-0 -top-5 text-xs text-[#A0A0A0]">
                  {formatTimeForDisplay(timeBlock.end, use24HourFormat)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity input - Only show if not in color picker only mode */}
        {!isColorPickerOnly && (
          <div className="grid gap-2">
            <Label htmlFor="label">Activity</Label>
            <Input
              id="label"
              value={timeBlock.label}
              onChange={(e) => setTimeBlock({ ...timeBlock, label: e.target.value })}
              placeholder="Work, Class, etc."
              className="bg-[#242424] border-[#333333] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:border-[var(--focus-ring-color)]"
              style={{ backgroundColor: "#242424" }}
            />
          </div>
        )}
        {/* Footer */}
        <div className="flex flex-row items-center justify-between sm:justify-between p-6 pt-0">
          {/* Different footer based on mode */}
          {isColorPickerOnly ? (
            <div className="w-full flex justify-center mt-4">
              <Button 
                onClick={onClose}
                className="bg-[#333333] text-white hover:bg-[#444444] border-[#444444] mx-auto"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              {editMode && onDelete && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="bg-[#CF6679] hover:bg-[#B25563] text-white h-9 px-3 text-xs sm:text-sm"
                >
                  <Trash2 className="h-3 w-3 mr-1 sm:mr-2" />
                  Delete
                </Button>
              )}
              {!editMode && <div></div>} {/* Empty div to maintain spacing when delete button isn't shown */}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={onClose} className="bg-[#333333] text-white hover:bg-[#444444] border-[#444444]">
                  Cancel
                </Button>
                {/* Use currentColor instead of userColor for the button */}
                <Button
                  onClick={handleSave}
                  style={{ backgroundColor: currentColor, color: "#000" }}
                  className="h-9 px-3 text-xs sm:text-sm hover:opacity-90"
                >
                  {editMode ? "Update" : "Add"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      <style jsx global>{`
        [data-state="checked"] {
          background-color: ${currentColor};
          color: #000;
        }
        
        .focus-visible:focus-visible {
          border-color: var(--focus-ring-color);
          ring-color: var(--focus-ring-color);
        }
        
        input:focus-visible, select:focus-visible {
          border-color: var(--focus-ring-color);
          outline-color: var(--focus-ring-color);
          ring-color: var(--focus-ring-color);
        }
      `}</style>
    </div>
  )
}
