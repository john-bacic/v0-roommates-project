"use client"

import { useState, useEffect, useRef } from "react"
import { CircularTimePicker } from "./circular-time-picker"
import { X } from "lucide-react"

// Helper to detect if we're on a mobile device
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
}

interface RollingNumberProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function RollingNumber({ value, min, max, step, onChange }: RollingNumberProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const numbersRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const [displayedNumbers, setDisplayedNumbers] = useState<number[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragCurrentY, setDragCurrentY] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const [currentValue, setCurrentValue] = useState(value)
  const [lastMoveTime, setLastMoveTime] = useState(0)
  const [lastMoveY, setLastMoveY] = useState(0)
  const [animating, setAnimating] = useState(false)
  
  // Handle wheel events for desktop
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    // Determine direction and amount
    const delta = e.deltaY > 0 ? -1 : 1
    updateValue(currentValue + (delta * step))
  }
  
  // Update internal value and notify parent
  const updateValue = (newVal: number) => {
    // Handle wrapping
    let adjustedValue = newVal
    while (adjustedValue < min) adjustedValue = max - (min - adjustedValue - 1)
    while (adjustedValue > max) adjustedValue = min + (adjustedValue - max - 1)
    
    setCurrentValue(adjustedValue)
    onChange(adjustedValue)
    generateNumbers(adjustedValue)
  }
  
  // Generate the array of numbers to display
  const generateNumbers = (centerValue: number) => {
    const numbers = []
    
    // 4 numbers before current
    for (let i = 4; i > 0; i--) {
      let num = centerValue - (i * step)
      while (num < min) num = max - (min - num - step) + step
      numbers.push(num)
    }
    
    // Current value
    numbers.push(centerValue)
    
    // 4 numbers after current
    for (let i = 1; i <= 4; i++) {
      let num = centerValue + (i * step)
      while (num > max) num = min + (num - max - step) + step
      numbers.push(num)
    }
    
    setDisplayedNumbers(numbers)
  }
  
  // Set up wheel event listener and initialize numbers
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      
      return () => {
        container.removeEventListener('wheel', handleWheel)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [currentValue])
  
  // Update when external value changes
  useEffect(() => {
    // Only update if the value actually changed
    if (value !== currentValue) {
      setCurrentValue(value)
      generateNumbers(value)
    }
  }, [value])
  
  // Initialize numbers on first render
  useEffect(() => {
    generateNumbers(currentValue)
  }, [])
  
  // Mouse/Touch event handlers
  const handleStartDrag = (clientY: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    setIsDragging(true)
    setDragStartY(clientY)
    setDragCurrentY(clientY)
    setLastMoveTime(Date.now())
    setLastMoveY(clientY)
    setVelocity(0)
    setAnimating(false)
  }
  
  const handleMoveDrag = (clientY: number) => {
    if (!isDragging) return
    
    // Calculate velocity for momentum scrolling
    const now = Date.now()
    const elapsed = now - lastMoveTime
    if (elapsed > 0) {
      const distance = lastMoveY - clientY
      setVelocity(distance / elapsed * 15) // Scale factor
    }
    
    setLastMoveTime(now)
    setLastMoveY(clientY)
    setDragCurrentY(clientY)
    
    // Calculate how much to change the value
    const deltaY = dragStartY - clientY
    const valueChange = Math.floor(Math.abs(deltaY) / 30) * (deltaY > 0 ? 1 : -1)
    
    if (valueChange !== 0) {
      updateValue(currentValue + (valueChange * step))
      setDragStartY(clientY)
    }
  }
  
  const handleEndDrag = () => {
    setIsDragging(false)
    
    // Start momentum scrolling animation
    if (Math.abs(velocity) > 0.1) {
      setAnimating(true)
      let lastTimestamp = performance.now()
      
      const animate = (timestamp: number) => {
        const delta = timestamp - lastTimestamp
        lastTimestamp = timestamp
        
        // Decay velocity
        const newVelocity = velocity * 0.95
        setVelocity(newVelocity)
        
        // Apply velocity to scroll
        const pixelDelta = newVelocity * delta / 20
        if (Math.abs(pixelDelta) > 5) {
          const valueChange = Math.sign(pixelDelta) * step
          updateValue(currentValue + valueChange)
        }
        
        // Continue animation if velocity is significant
        if (Math.abs(newVelocity) > 0.05) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setAnimating(false)
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
  }
  
  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStartDrag(e.clientY)
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      handleMoveDrag(e.clientY)
    }
  }
  
  const handleMouseUp = () => {
    if (isDragging) {
      handleEndDrag()
    }
  }
  
  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleStartDrag(e.touches[0].clientY)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault()
      handleMoveDrag(e.touches[0].clientY)
    }
  }
  
  const handleTouchEnd = () => {
    if (isDragging) {
      handleEndDrag()
    }
  }
  
  // Handle direct click on a number
  const handleNumberClick = (num: number) => {
    updateValue(num)
  }
  
  return (
    <div 
      className="h-40 overflow-hidden bg-[#222222] rounded-lg relative select-none"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-component-name="RollingNumberContainer"
    >
      {/* Gradient overlays for fading effect */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-[#222222] to-transparent pointer-events-none z-10"></div>
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#222222] to-transparent pointer-events-none z-10"></div>
      
      {/* Selection indicator */}
      <div className="absolute top-1/2 left-0 right-0 h-14 -mt-7 border-t border-b border-[#444444] pointer-events-none z-0"></div>
      
      {/* Numbers */}
      <div 
        className="flex flex-col items-center justify-center h-full"
        ref={numbersRef}
        data-component-name="RollingNumber"
      >
        {displayedNumbers.map((num, index) => {
          // Center value is at index 4 (we have 4 before, current, 4 after)
          const position = index - 4
          const isCurrent = index === 4
          
          return (
            <div 
              key={`${num}-${index}`}
              className={`flex items-center justify-center h-14 transition-transform duration-150 cursor-pointer ${isCurrent ? 'text-white text-2xl font-bold' : Math.abs(position) === 1 ? 'text-[#BBBBBB] text-lg' : 'text-[#888888] text-base'}`}
              style={{
                transform: `translateY(${position * 56}px)`,
                opacity: isCurrent ? 1 : Math.max(0.6, 1 - Math.abs(position) * 0.15)
              }}
              onClick={() => handleNumberClick(num)}
            >
              {num.toString().padStart(2, '0')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface TimePickerDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTime: string
  onTimeSelect: (time: string) => void
  use24HourFormat?: boolean
  userColor?: string
  title?: string
  label?: string
}

function MobileTimePicker({ time, onTimeChange, userColor }: { time: string, onTimeChange: (time: string) => void, userColor: string }) {
  // Parse time string "HH:MM" or "H:MM" into separate hour and minute values
  const [timeParts, setTimeParts] = useState(() => {
    const [hoursStr, minutesStr] = time.split(":")
    let hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    
    // Convert 24-hour format to 12-hour
    const period = hours >= 12 ? "PM" : "AM"
    if (hours === 0) hours = 12
    else if (hours > 12) hours = hours - 12
    
    return { hours, minutes, period }
  })

  // Update parent when time changes
  const updateTime = () => {
    // Convert back to 24-hour format
    let hours24 = timeParts.hours
    if (timeParts.period === "PM" && hours24 < 12) hours24 += 12
    else if (timeParts.period === "AM" && hours24 === 12) hours24 = 0
    
    const timeString = `${hours24.toString().padStart(2, '0')}:${timeParts.minutes.toString().padStart(2, '0')}`
    onTimeChange(timeString)
  }

  // Handle changes to hours, minutes, or period
  const handleHoursChange = (newHours: number) => {
    setTimeParts(prev => ({ ...prev, hours: newHours }))
  }

  const handleMinutesChange = (newMinutes: number) => {
    setTimeParts(prev => ({ ...prev, minutes: newMinutes }))
  }

  const handlePeriodToggle = () => {
    setTimeParts(prev => {
      const newPeriod = prev.period === "AM" ? "PM" : "AM"
      return { ...prev, period: newPeriod }
    })
  }

  // Update parent component when our state changes
  useEffect(() => {
    updateTime()
  }, [timeParts])

  // These functions will be called from the parent component
  useEffect(() => {
    if (time === "12:00") {
      setTimeParts({ hours: 12, minutes: 0, period: "PM" })
    } else if (time === "00:00") {
      setTimeParts({ hours: 12, minutes: 0, period: "AM" })
    } else {
      // Regular time update
      const [hoursStr, minutesStr] = time.split(":")
      let hours = parseInt(hoursStr, 10)
      const minutes = parseInt(minutesStr, 10)
      
      // Convert 24-hour format to 12-hour
      const period = hours >= 12 ? "PM" : "AM"
      if (hours === 0) hours = 12
      else if (hours > 12) hours = hours - 12
      
      setTimeParts({ hours, minutes, period })
    }
  }, [time])

  return (
    <div className="py-4">
      <div className="flex justify-center items-center gap-2">
        {/* Hours roller */}
        <div className="w-1/3">
          <RollingNumber 
            value={timeParts.hours} 
            min={1} 
            max={12} 
            step={1} 
            onChange={handleHoursChange} 
          />
        </div>
        
        <div className="text-2xl font-bold">:</div>
        
        {/* Minutes roller */}
        <div className="w-1/3">
          <RollingNumber 
            value={timeParts.minutes} 
            min={0} 
            max={59} 
            step={5} 
            onChange={handleMinutesChange} 
          />
        </div>
        
        {/* AM/PM toggle */}
        <div 
          className="w-1/4 h-40 flex items-center justify-center cursor-pointer bg-[#222222] rounded-lg"
          onClick={handlePeriodToggle}
        >
          <div className="text-xl font-bold">{timeParts.period}</div>
        </div>
      </div>
    </div>
  )
}

function DesktopTimePicker({ time, onTimeChange }: { time: string, onTimeChange: (time: string) => void }) {
  // Separate time and period state for better control
  const [timeValue, setTimeValue] = useState('')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  
  // Initialize values from the time prop
  useEffect(() => {
    // Format the time as HH:MM and determine AM/PM
    const [hoursStr, minutesStr] = time.split(":")
    let hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    
    // Convert 24-hour format to 12-hour
    const newPeriod = hours >= 12 ? "PM" : "AM"
    if (hours === 0) hours = 12
    else if (hours > 12) hours = hours - 12
    
    setTimeValue(`${hours}:${minutes.toString().padStart(2, '0')}`)
    setPeriod(newPeriod as 'AM' | 'PM')
  }, [time])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeValue(e.target.value)
  }
  
  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM'
    setPeriod(newPeriod)
    
    // Update parent with new time
    updateParentTime(timeValue, newPeriod)
  }
  
  // Convert to 24-hour format and notify parent
  const updateParentTime = (timeStr: string, periodStr: 'AM' | 'PM') => {
    try {
      // Parse HH:MM
      const timeParts = timeStr.split(':')
      if (timeParts.length !== 2) return
      
      let hours = parseInt(timeParts[0], 10)
      const minutes = parseInt(timeParts[1], 10)
      
      if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return
      
      // Convert to 24-hour format
      if (periodStr === "PM" && hours < 12) hours += 12
      else if (periodStr === "AM" && hours === 12) hours = 0
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      onTimeChange(formattedTime)
    } catch (err) {
      console.error('Error parsing time:', err)
    }
  }

  const handleBlur = () => {
    // Validate the time format (H:MM or HH:MM)
    try {
      const regex = /^(\d{1,2}):(\d{2})$/
      const match = timeValue.match(regex)
      
      if (match) {
        const hours = parseInt(match[1], 10)
        const minutes = parseInt(match[2], 10)
        
        // Validate hours and minutes
        if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
          // Valid format, update parent
          updateParentTime(timeValue, period)
          return
        }
      }
      
      // If we got here, the input was invalid, so reset to the previous value
      const [hoursStr, minutesStr] = time.split(":")
      let hours = parseInt(hoursStr, 10)
      const minutes = parseInt(minutesStr, 10)
      
      const newPeriod = hours >= 12 ? "PM" : "AM"
      if (hours === 0) hours = 12
      else if (hours > 12) hours = hours - 12
      
      setTimeValue(`${hours}:${minutes.toString().padStart(2, '0')}`)
      setPeriod(newPeriod as 'AM' | 'PM')
    } catch (error) {
      console.error("Error parsing time input:", error)
      // Reset to current value
      const [hoursStr, minutesStr] = time.split(":")
      let hours = parseInt(hoursStr, 10)
      const minutes = parseInt(minutesStr, 10)
      
      const newPeriod = hours >= 12 ? "PM" : "AM"
      if (hours === 0) hours = 12
      else if (hours > 12) hours = hours - 12
      
      setTimeValue(`${hours}:${minutes.toString().padStart(2, '0')}`)
      setPeriod(newPeriod as 'AM' | 'PM')
    }
  }

  // This component now uses timeValue and period state instead of inputValue
  // The initialization is handled in the useEffect above

  return (
    <div className="py-8 flex flex-col items-center">
      <div className="relative w-full max-w-xs">
        <input
          type="text"
          value={timeValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="text-2xl font-bold text-center bg-[#333333] border border-[#444444] rounded-lg py-4 pl-6 pr-16 w-full"
          placeholder="12:00"
          aria-label="Time input"
          data-component-name="DesktopTimePicker"
        />
        <button 
          type="button"
          onClick={togglePeriod}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#444444] hover:bg-[#555555] text-white font-medium rounded-md px-3 py-1.5 transition-colors border-2 border-[#222222] shadow-sm"
          aria-label="Toggle AM/PM"
          data-component-name="DesktopTimePicker"
        >
          {period}
        </button>
      </div>
    </div>
  )
}

export function TimePickerDialog({
  isOpen,
  onClose,
  initialTime,
  onTimeSelect,
  use24HourFormat = false,
  userColor = "#03DAC6",
  title = "Select Time",
  label
}: TimePickerDialogProps) {
  const [time, setTime] = useState(initialTime || "12:00")
  const [isMobileView, setIsMobileView] = useState(isMobile())

  // Track window size changes to update the view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isMobile())
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTime(initialTime)
      // Prevent scrolling on body when dialog is open
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen, initialTime])

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    // Automatically save the time change
    onTimeSelect(newTime)
  }

  const handleConfirm = () => {
    onTimeSelect(time)
    onClose()
  }
  
  const handleNoonClick = () => {
    const noonTime = "12:00" // 12:00 PM in 24-hour format
    setTime(noonTime)
    handleTimeChange(noonTime)
  }

  const handleMidnightClick = () => {
    const midnightTime = "00:00" // 12:00 AM in 24-hour format
    setTime(midnightTime)
    handleTimeChange(midnightTime)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-[#282828] rounded-lg w-full max-w-sm mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#333333]" data-component-name="TimePickerDialog">
          <div>
            <h3 className="text-xl font-semibold" data-component-name="TimePickerDialog">{title}</h3>
            {label && (
              <p className="text-sm text-[#A0A0A0] mt-1" data-component-name="TimePickerDialog">
                {label}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#333333] text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 pb-2" data-component-name="TimePickerDialog">
          {isMobileView ? (
            <MobileTimePicker 
              time={time} 
              onTimeChange={handleTimeChange} 
              userColor={userColor} 
            />
          ) : (
            <DesktopTimePicker 
              time={time} 
              onTimeChange={handleTimeChange} 
            />
          )}
          
          {/* Preset buttons */}
          <div className="flex justify-center gap-4 mt-4 mb-4">
            <button
              type="button"
              className="px-6 py-2 rounded-md bg-[#222222] hover:bg-[#333333] text-white border border-[#444444] transition-all"
              onClick={handleNoonClick}
            >
              Noon
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded-md bg-[#222222] hover:bg-[#333333] text-white border border-[#444444] transition-all"
              onClick={handleMidnightClick}
            >
              Midnight
            </button>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded bg-[#333333] hover:bg-[#444444] text-white font-medium w-full max-w-md"
              data-component-name="TimePickerDialog"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
