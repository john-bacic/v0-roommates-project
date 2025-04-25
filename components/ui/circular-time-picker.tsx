"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"

interface CircularTimePickerProps {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
  userColor?: string
}

export function CircularTimePicker({
  id,
  value,
  onChange,
  label,
  className = "",
  userColor = "#666666",
}: CircularTimePickerProps) {
  const [hours, setHours] = useState<number>(1)
  const [minutes, setMinutes] = useState<number>(0)
  const [period, setPeriod] = useState<"AM" | "PM">("AM")
  const [isHoursMode, setIsHoursMode] = useState<boolean>(true)
  
  // Parse the initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(v => parseInt(v, 10))
      
      // Convert from 24-hour to 12-hour format
      if (h === 0) {
        setHours(12)
        setPeriod("AM")
      } else if (h < 12) {
        setHours(h)
        setPeriod("AM")
      } else if (h === 12) {
        setHours(12)
        setPeriod("PM")
      } else {
        setHours(h - 12)
        setPeriod("PM")
      }
      
      setMinutes(m)
    }
  }, [value])
  
  // Update the parent when hours, minutes, or period change
  const updateTime = (newHours: number, newMinutes: number, newPeriod: "AM" | "PM") => {
    let hourValue = newHours
    
    // Convert from 12-hour to 24-hour
    if (newPeriod === "PM" && hourValue < 12) {
      hourValue += 12
    } else if (newPeriod === "AM" && hourValue === 12) {
      hourValue = 0
    }
    
    const formattedHours = hourValue.toString().padStart(2, "0")
    const formattedMinutes = newMinutes.toString().padStart(2, "0")
    onChange(`${formattedHours}:${formattedMinutes}`)
  }
  
  const handleTimeClick = (value: number) => {
    if (isHoursMode) {
      setHours(value)
      updateTime(value, minutes, period)
      // Don't automatically switch to minutes mode
    } else {
      setMinutes(value)
      updateTime(hours, value, period)
    }
  }
  
  const handlePeriodChange = () => {
    const newPeriod = period === "AM" ? "PM" : "AM"
    setPeriod(newPeriod)
    updateTime(hours, minutes, newPeriod)
  }
  
  const handleModeToggle = () => {
    setIsHoursMode(!isHoursMode)
  }

  // Generate positions for hours or minutes
  const generateTimeNumbers = () => {
    const items = []
    const count = isHoursMode ? 12 : 12 // 12 hours or 12 5-minute intervals
    
    for (let i = 0; i < count; i++) {
      // For hours: 1-12, For minutes: 0, 5, 10, ..., 55
      const value = isHoursMode ? (i === 0 ? 12 : i) : i * 5
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2 // Start at the top (12 o'clock position)
      const radius = 42 // Percentage of clock face radius
      const x = 50 + radius * Math.cos(angle)
      const y = 50 + radius * Math.sin(angle)
      
      const isSelected = isHoursMode 
        ? value === hours 
        : value === Math.floor(minutes / 5) * 5

      items.push(
        <div 
          key={`time-${value}`}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${isSelected ? 'text-white' : 'text-black'}`}
          style={{ 
            left: `${x}%`, 
            top: `${y}%`,
            backgroundColor: isSelected ? '#333333' : 'transparent'
          }}
          onClick={() => handleTimeClick(value)}
        >
          {value}
        </div>
      )
    }
    
    return items
  }

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      
      {/* Clock display showing current time */}
      <div 
        className="mx-auto rounded-lg w-80 h-80 mb-3 relative bg-[#242424] p-4"
      >
        {/* Clock face with user color */}
        <div
          className="w-full h-full rounded-full relative"
          style={{ backgroundColor: userColor }}
        >
        {/* Center time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-black text-2xl font-bold">
            {`${hours}:${minutes.toString().padStart(2, '0')}${period}`}
          </div>
        </div>
        
        {/* Clock markers */}
        {generateTimeNumbers()}
        </div>
      </div>
      
      {/* AM/PM toggle */}
      <div className="flex justify-center gap-2">
        <button 
          type="button"
          className={`px-8 py-3 rounded ${period === 'AM' ? 'bg-[#333333] text-white' : 'bg-[#222222] text-gray-400'}`}
          onClick={() => {
            setPeriod("AM")
            updateTime(hours, minutes, "AM")
          }}
        >
          AM
        </button>
        <button 
          type="button"
          className={`px-8 py-3 rounded ${period === 'PM' ? 'bg-[#333333] text-white' : 'bg-[#222222] text-gray-400'}`}
          onClick={() => {
            setPeriod("PM")
            updateTime(hours, minutes, "PM")
          }}
        >
          PM
        </button>
      </div>
      
      {/* Mode toggle (hours/minutes) */}
      <div className="flex justify-center gap-2 mt-2">
        <button 
          type="button"
          className={`px-8 py-3 rounded ${isHoursMode ? 'bg-[#333333] text-white' : 'bg-[#222222] text-gray-400'}`}
          onClick={() => setIsHoursMode(true)}
        >
          Hours
        </button>
        <button 
          type="button"
          className={`px-8 py-3 rounded ${!isHoursMode ? 'bg-[#333333] text-white' : 'bg-[#222222] text-gray-400'}`}
          onClick={() => setIsHoursMode(false)}
        >
          Minutes
        </button>
      </div>
    </div>
  )
}
