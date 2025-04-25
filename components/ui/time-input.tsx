"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import "./time-input.css"

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
  
  // Function to increment hours
  const incrementHours = () => {
    if (use24HourFormat) {
      const newHours = (parseInt(hours || "0") + 1) % 24;
      setHours(newHours.toString().padStart(2, "0"));
      updateTime(newHours.toString(), minutes);
    } else {
      const newHours = hours === "12" ? 1 : (parseInt(hours || "0") + 1);
      setHours(newHours > 12 ? "1" : newHours.toString());
      updateTime(newHours > 12 ? "1" : newHours.toString(), minutes, period);
    }
  };

  // Function to decrement hours
  const decrementHours = () => {
    if (use24HourFormat) {
      const newHours = (parseInt(hours || "0") - 1 + 24) % 24;
      setHours(newHours.toString().padStart(2, "0"));
      updateTime(newHours.toString(), minutes);
    } else {
      const newHours = hours === "1" ? 12 : (parseInt(hours || "0") - 1);
      setHours(newHours < 1 ? "12" : newHours.toString());
      updateTime(newHours < 1 ? "12" : newHours.toString(), minutes, period);
    }
  };

  // Function to increment minutes
  const incrementMinutes = () => {
    const newMinutes = (parseInt(minutes || "0") + 1) % 60;
    setMinutes(newMinutes.toString().padStart(2, "0"));
    updateTime(hours, newMinutes.toString().padStart(2, "0"), period);
  };

  // Function to decrement minutes
  const decrementMinutes = () => {
    const newMinutes = (parseInt(minutes || "0") - 1 + 60) % 60;
    setMinutes(newMinutes.toString().padStart(2, "0"));
    updateTime(hours, newMinutes.toString().padStart(2, "0"), period);
  };

  return (
    <div className="flex flex-col space-y-1" data-component-name="TimeInput">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="time-picker-container" data-component-name="TimeInput">
        {/* Hours Picker */}
        <div className="time-picker-unit">
          <button 
            type="button" 
            onClick={incrementHours}
            className="time-picker-button"
            aria-label="Increment hours"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <div 
            id={`${id}-hours`}
            className="time-picker-value"
          >
            {hours.padStart(2, "0")}
          </div>
          <button 
            type="button" 
            onClick={decrementHours}
            className="time-picker-button"
            aria-label="Decrement hours"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        
        <span className="time-picker-separator">:</span>
        
        {/* Minutes Picker */}
        <div className="time-picker-unit">
          <button 
            type="button" 
            onClick={incrementMinutes}
            className="time-picker-button"
            aria-label="Increment minutes"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <div 
            id={`${id}-minutes`}
            className="time-picker-value"
          >
            {minutes.padStart(2, "0")}
          </div>
          <button 
            type="button" 
            onClick={decrementMinutes}
            className="time-picker-button"
            aria-label="Decrement minutes"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        
        {/* AM/PM Toggle */}
        {!use24HourFormat && (
          <div className="time-picker-unit ml-2">
            <button 
              type="button"
              onClick={handlePeriodChange}
              className="time-picker-button"
              aria-label="Toggle AM/PM"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <div className="time-picker-value">
              {period}
            </div>
            <button 
              type="button"
              onClick={handlePeriodChange}
              className="time-picker-button"
              aria-label="Toggle AM/PM"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
