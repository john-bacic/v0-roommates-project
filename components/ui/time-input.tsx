"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import "./time-input.css"

interface TimeInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  use24HourFormat?: boolean
  className?: string
  userColor?: string
}

export function TimeInput({
  id,
  value,
  onChange,
  label,
  use24HourFormat = true,
  className = "",
  userColor = "#FFFFFF",
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
    
    // Only allow digits
    if (!/^\d*$/.test(newHours)) {
      return
    }
    
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
    
    // Only allow digits
    if (!/^\d*$/.test(newMinutes)) {
      return
    }
    
    // Ensure minutes are between 0-59
    if (newMinutes === "") {
      setMinutes("")
    } else {
      const numericMinutes = parseInt(newMinutes, 10)
      if (!isNaN(numericMinutes) && numericMinutes >= 0 && numericMinutes <= 59) {
        // Pad with leading zero if single digit
        if (newMinutes.length === 1) {
          newMinutes = newMinutes.padStart(2, '0')
        }
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
      <div className="flex items-center justify-center bg-[#242424] border border-[#333333] rounded-md w-full cursor-pointer">
        <div className="flex items-center">
          <Input
            id={`${id}-hours`}
            type="text"
            value={hours}
            onChange={handleHoursChange}
            onBlur={() => {
              // Ensure hours are properly formatted on blur
              if (hours === '') {
                setHours(use24HourFormat ? '00' : '12')
                updateTime(use24HourFormat ? '00' : '12', minutes, period)
              } else if (hours.length === 1) {
                setHours(hours.padStart(2, '0'))
              }
            }}
            className="w-8 sm:w-10 min-w-0 border-none bg-transparent text-center no-spinners px-1 sm:px-3"
            style={{ color: userColor }}
            placeholder={use24HourFormat ? "00" : "12"}
          />
          <span style={{ color: userColor }} className="mx-0.5 sm:mx-1">:</span>
          <Input
            id={`${id}-minutes`}
            type="text"
            value={minutes}
            onChange={handleMinutesChange}
            onBlur={() => {
              // Ensure minutes are properly formatted on blur
              if (minutes === '') {
                setMinutes('00')
                updateTime(hours, '00', period)
              } else if (minutes.length === 1) {
                setMinutes(minutes.padStart(2, '0'))
                updateTime(hours, minutes.padStart(2, '0'), period)
              }
            }}
            className="w-8 sm:w-10 min-w-0 border-none bg-transparent text-center no-spinners px-1 sm:px-3"
            style={{ color: userColor }}
            placeholder="00"
          />
          {!use24HourFormat && (
            <span 
              className="ml-1 sm:ml-2 px-1 sm:px-2 py-1 text-xs rounded cursor-pointer"
              onClick={handlePeriodChange}
              style={{ 
                backgroundColor: period === 'AM' ? userColor : '#333333',
                color: period === 'AM' ? '#222222' : userColor
              }}
              data-component-name="TimeInput"
            >
              {period}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
