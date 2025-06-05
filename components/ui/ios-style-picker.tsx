"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface IosStylePickerProps {
  value: string
  onChange: (value: string) => void
  use24Hour?: boolean
  userColor?: string
}

export const IosStylePicker: React.FC<IosStylePickerProps> = ({
  value,
  onChange,
  use24Hour = false,
  userColor = "#F8D667"
}) => {
  // Parse initial time
  const parseTime = (timeStr: string) => {
    try {
      const match = timeStr.match(/^(\d{1,2}):(\d{1,2})$/)
      if (match) {
        let hours = parseInt(match[1], 10)
        const minutes = parseInt(match[2], 10)
        
        // Convert to 12-hour format if needed
        let period = "AM"
        if (!use24Hour) {
          period = hours >= 12 ? "PM" : "AM"
          if (hours === 0) hours = 12
          else if (hours > 12) hours = hours - 12
        }
        
        return { hours, minutes, period }
      }
    } catch (e) {
      console.error("Error parsing time:", e)
    }
    
    // Default values
    return { hours: 12, minutes: 0, period: "AM" }
  }
  
  const [timeParts, setTimeParts] = useState(() => parseTime(value))
  
  // Update time parts when value changes
  useEffect(() => {
    setTimeParts(parseTime(value))
  }, [value])
  
  // Handle changes to hours
  const handleHoursChange = (newHours: number) => {
    const updatedTimeParts = { ...timeParts, hours: newHours }
    setTimeParts(updatedTimeParts)
    
    // Convert back to 24-hour format if needed
    let hours24 = updatedTimeParts.hours
    if (!use24Hour) {
      if (updatedTimeParts.period === "PM" && hours24 < 12) hours24 += 12
      if (updatedTimeParts.period === "AM" && hours24 === 12) hours24 = 0
    }
    
    onChange(`${hours24.toString().padStart(2, '0')}:${updatedTimeParts.minutes.toString().padStart(2, '0')}`)
  }
  
  // Handle changes to minutes
  const handleMinutesChange = (newMinutes: number) => {
    const updatedTimeParts = { ...timeParts, minutes: newMinutes }
    setTimeParts(updatedTimeParts)
    
    // Convert back to 24-hour format if needed
    let hours24 = updatedTimeParts.hours
    if (!use24Hour) {
      if (updatedTimeParts.period === "PM" && hours24 < 12) hours24 += 12
      if (updatedTimeParts.period === "AM" && hours24 === 12) hours24 = 0
    }
    
    onChange(`${hours24.toString().padStart(2, '0')}:${updatedTimeParts.minutes.toString().padStart(2, '0')}`)
  }
  
  // Handle changes to period (AM/PM)
  const handlePeriodToggle = () => {
    const newPeriod = timeParts.period === "AM" ? "PM" : "AM"
    const updatedTimeParts = { ...timeParts, period: newPeriod }
    setTimeParts(updatedTimeParts)
    
    // Convert back to 24-hour format
    let hours24 = updatedTimeParts.hours
    if (updatedTimeParts.period === "PM" && hours24 < 12) hours24 += 12
    if (updatedTimeParts.period === "AM" && hours24 === 12) hours24 = 0
    
    onChange(`${hours24.toString().padStart(2, '0')}:${updatedTimeParts.minutes.toString().padStart(2, '0')}`)
  }
  
  // Generate options for hours and minutes
  const hourOptions = Array.from({ length: use24Hour ? 24 : 12 }, (_, i) => {
    return use24Hour ? i : (i + 1 > 12 ? 1 : i + 1)
  })
  
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5)
  
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center space-x-2 py-4">
        {/* Hours picker */}
        <div className="w-16 h-32 relative overflow-hidden bg-[#1e1e1e] border border-[#333333] rounded-lg">
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-[#1e1e1e] to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[#1e1e1e] to-transparent pointer-events-none z-10" />
            
            {/* Selected item highlight */}
            <div 
              className="absolute left-0 right-0 h-10 border-t border-b border-[#333333] top-1/2 -mt-5 z-0"
              style={{ backgroundColor: `${userColor}20` }} 
            />
            
            <div className="flex flex-col items-center py-16">
              {hourOptions.map((hour) => (
                <div 
                  key={hour} 
                  className={`h-10 flex items-center justify-center cursor-pointer transition-all duration-200 w-full px-2 ${
                    hour === timeParts.hours ? 'text-xl font-medium' : 'text-base opacity-50'
                  }`}
                  style={{ color: hour === timeParts.hours ? userColor : '#FFFFFF' }}
                  onClick={() => handleHoursChange(hour)}
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Colon separator */}
        <div className="text-2xl font-bold text-white">:</div>
        
        {/* Minutes picker */}
        <div className="w-16 h-32 relative overflow-hidden bg-[#1e1e1e] border border-[#333333] rounded-lg">
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-[#1e1e1e] to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[#1e1e1e] to-transparent pointer-events-none z-10" />
            
            {/* Selected item highlight */}
            <div 
              className="absolute left-0 right-0 h-10 border-t border-b border-[#333333] top-1/2 -mt-5 z-0"
              style={{ backgroundColor: `${userColor}20` }} 
            />
            
            <div className="flex flex-col items-center py-16">
              {minuteOptions.map((minute) => (
                <div 
                  key={minute} 
                  className={`h-10 flex items-center justify-center cursor-pointer transition-all duration-200 w-full px-2 ${
                    minute === timeParts.minutes ? 'text-xl font-medium' : 'text-base opacity-50'
                  }`}
                  style={{ color: minute === timeParts.minutes ? userColor : '#FFFFFF' }}
                  onClick={() => handleMinutesChange(minute)}
                >
                  {minute.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* AM/PM toggle (only for 12-hour format) */}
        {!use24Hour && (
          <motion.div 
            className="w-16 h-10 flex items-center justify-center cursor-pointer rounded-md select-none touch-none"
            onClick={handlePeriodToggle}
            style={{ 
              backgroundColor: timeParts.period === 'AM' ? userColor : '#333333'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="text-xl font-medium px-3 py-1" 
              style={{ color: timeParts.period === 'AM' ? '#222222' : userColor }}
            >
              {timeParts.period}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
