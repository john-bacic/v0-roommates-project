"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TimeInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  use24HourFormat?: boolean
  className?: string
}

export function TimeInput({
  id,
  value,
  onChange,
  label,
  use24HourFormat = true,
  className = "",
}: TimeInputProps) {
  const [hours, setHours] = useState<string>("")
  const [minutes, setMinutes] = useState<string>("")
  const [period, setPeriod] = useState<"AM" | "PM">("AM")
  
  // Parse the initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(v => v.padStart(2, "0"))
      const hourNum = parseInt(h, 10)
      
      if (use24HourFormat) {
        // In 24-hour mode, just use the hours directly
        setHours(h)
      } else {
        // In 12-hour mode, convert to 12-hour format
        if (hourNum === 0) {
          setHours("12")
          setPeriod("AM")
        } else if (hourNum < 12) {
          setHours(hourNum.toString())
          setPeriod("AM")
        } else if (hourNum === 12) {
          setHours("12")
          setPeriod("PM")
        } else {
          setHours((hourNum - 12).toString())
          setPeriod("PM")
        }
      }
      
      setMinutes(m)
    }
  }, [value, use24HourFormat])
  
  // Update the parent when hours, minutes, or period change
  const updateTime = (newHours: string, newMinutes: string, newPeriod?: "AM" | "PM") => {
    let hourValue = parseInt(newHours, 10)
    
    // Convert from 12-hour to 24-hour if needed
    if (!use24HourFormat && newPeriod) {
      if (newPeriod === "PM" && hourValue < 12) {
        hourValue += 12
      } else if (newPeriod === "AM" && hourValue === 12) {
        hourValue = 0
      }
    }
    
    const formattedHours = hourValue.toString().padStart(2, "0")
    const formattedMinutes = newMinutes.padStart(2, "0")
    onChange(`${formattedHours}:${formattedMinutes}`)
  }
  
  // Handle hours input
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newHours = e.target.value
    
    if (newHours === "") {
      setHours("")
      return
    }
    
    const numericHours = parseInt(newHours, 10)
    
    if (isNaN(numericHours)) {
      return
    }
    
    if (use24HourFormat) {
      // 24-hour format: 0-23
      if (numericHours >= 0 && numericHours <= 23) {
        setHours(newHours)
        updateTime(newHours, minutes)
      }
    } else {
      // 12-hour format: 1-12
      if (numericHours >= 1 && numericHours <= 12) {
        setHours(newHours)
        updateTime(newHours, minutes, period)
      }
    }
  }
  
  // Handle minutes input
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newMinutes = e.target.value
    // Ensure minutes are between 0-59
    if (newMinutes === "") {
      setMinutes("")
    } else {
      const numericMinutes = parseInt(newMinutes, 10)
      if (!isNaN(numericMinutes) && numericMinutes >= 0 && numericMinutes <= 59) {
        setMinutes(newMinutes)
        updateTime(hours, newMinutes, period)
      }
    }
  }
  
  // Handle period change (AM/PM)
  const handlePeriodChange = () => {
    const newPeriod = period === "AM" ? "PM" : "AM"
    setPeriod(newPeriod)
    updateTime(hours, minutes, newPeriod)
  }
  
  return (
    <div className="flex flex-col space-y-1">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-center bg-[#242424] border border-[#333333] rounded-md">
        <Input
          id={`${id}-hours`}
          type="number"
          min={use24HourFormat ? "0" : "1"}
          max={use24HourFormat ? "23" : "12"}
          value={hours}
          onChange={handleHoursChange}
          className="w-12 border-none bg-transparent text-white text-center"
          placeholder={use24HourFormat ? "00" : "12"}
        />
        <span className="text-white mx-1">:</span>
        <Input
          id={`${id}-minutes`}
          type="number"
          min="0"
          max="59"
          value={minutes}
          onChange={handleMinutesChange}
          className="w-12 border-none bg-transparent text-white text-center"
          placeholder="00"
        />
        {!use24HourFormat && (
          <button 
            type="button"
            onClick={handlePeriodChange}
            className="ml-2 px-2 py-1 text-xs bg-[#333333] text-white rounded hover:bg-[#444444] focus:outline-none"
          >
            {period}
          </button>
        )}
      </div>
    </div>
  )
}
