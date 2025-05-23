"use client"

import { useState, useEffect, useRef } from "react"
import { CircularTimePicker } from "./circular-time-picker"
import { X, ChevronUp, ChevronDown, Sun, Moon } from "lucide-react"
import { Button } from "./button"
import { motion, AnimatePresence } from "framer-motion"

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
  userColor?: string
}

function RollingNumber({ value, min, max, step, onChange, userColor = "#FFFFFF" }: RollingNumberProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const numbersRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const [displayedNumbers, setDisplayedNumbers] = useState<number[]>([])
  // Simplified state - removed drag-related state variables
  const [currentValue, setCurrentValue] = useState(value)
  
  // Handle wheel events for desktop
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    // Determine direction and amount
    const delta = e.deltaY > 0 ? -1 : 1
    
    // Update value based on wheel direction
    updateValue(currentValue + (delta * step))
  }
  
  // Update value with cycling behavior when reaching bounds
  const updateValue = (newValue: number) => {
    // Apply cycling (wrapping) behavior instead of bounds
    let cyclicValue = newValue
    
    // Calculate the range size (add 1 because range is inclusive)
    const range = max - min + 1
    
    // Handle cycling with a simpler, more robust approach
    if (cyclicValue < min) {
      // When going below min, wrap to max (or appropriate value)
      cyclicValue = max - ((min - cyclicValue - 1) % range)
      // Safety check to prevent invalid values
      if (isNaN(cyclicValue) || cyclicValue < min || cyclicValue > max) {
        cyclicValue = max
      }
    } else if (cyclicValue > max) {
      // When going above max, wrap to min (or appropriate value)
      cyclicValue = min + ((cyclicValue - max - 1) % range)
      // Safety check to prevent invalid values
      if (isNaN(cyclicValue) || cyclicValue < min || cyclicValue > max) {
        cyclicValue = min
      }
    }
    
    // Only update if value changed
    if (cyclicValue !== currentValue) {
      // Add haptic feedback for value changes if available
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          // Special feedback when cycling from min to max or max to min
          if (newValue < min || newValue > max) {
            navigator.vibrate(5) // Simple feedback for cycling
          } else {
            navigator.vibrate(3) // Subtle feedback for regular changes
          }
        }
      } catch (e) {
        // Ignore vibration errors
      }
      
      setCurrentValue(cyclicValue)
      onChange(cyclicValue)
      generateNumbers(cyclicValue)
    }
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
  
  // Set up wheel event listener
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      
      return () => {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [])
  
  // Update when external value changes
  useEffect(() => {
    // Always update on mount or when value changes
    setCurrentValue(value)
    generateNumbers(value)
  }, [value])
  
  // Initialize numbers on first render and whenever value changes
  useEffect(() => {
    generateNumbers(currentValue)
  }, [currentValue])
  
  // Handle direct number click with enhanced feedback
  const handleNumberClick = (num: number) => {
    // Provide haptic feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5) // Subtle feedback for taps
    }
    
    // Update the value
    updateValue(num)
  }
  
  // Reset displayed numbers when the component mounts or value changes
  useEffect(() => {
    generateNumbers(currentValue)
  }, [currentValue])
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Up chevron */}
      <motion.div 
        className="w-full flex justify-center mb-1 cursor-pointer select-none touch-none"
        onClick={() => updateValue(currentValue + step)}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5, ease: 'easeInOut' }}
        >
          <ChevronUp className="hover:text-white transition-colors" style={{ color: userColor }} size={24} />
        </motion.div>
      </motion.div>
      
      <div 
        className="h-32 overflow-hidden bg-[#1e1e1e] border border-[#333333] rounded-lg relative select-none w-full touch-none"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          perspective: '800px',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
          transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out'
        }}
        ref={containerRef}
        data-component-name="RollingNumberContainer"
      >
        {/* Enhanced 3D roller drum effect */}
        
        {/* Gradient overlays for fading top and bottom */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-[#151515] to-transparent pointer-events-none z-10"
          style={{ opacity: 0.9 }}
        ></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#151515] to-transparent pointer-events-none z-10"
          style={{ opacity: 0.9 }}
        ></div>
        
        {/* Side lighting effects to enhance cylindrical appearance */}
        <div className="absolute top-0 bottom-0 left-0 w-[10%] bg-gradient-to-r from-[#111111] to-transparent pointer-events-none z-9" 
          style={{ opacity: 0.7 }}
        ></div>
        <div className="absolute top-0 bottom-0 right-0 w-[10%] bg-gradient-to-l from-[#111111] to-transparent pointer-events-none z-9" 
          style={{ opacity: 0.7 }}
        ></div>
        
        {/* 3D cylindrical effect with curved surfaces */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black to-transparent pointer-events-none z-0" 
          style={{ 
            borderRadius: '60% 60% 0 0 / 30%',
            opacity: 0.7,
            transform: 'translateY(-10px) scale(1.1)'
          }}
        ></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" 
          style={{ 
            borderRadius: '0 0 60% 60% / 30%',
            opacity: 0.7,
            transform: 'translateY(10px) scale(1.1)'
          }}
        ></div>
        
        {/* Center highlight band with enhanced depth */}
        <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 pointer-events-none z-1" 
          style={{ 
            background: 'linear-gradient(to bottom, rgba(80,80,80,0.2), rgba(50,50,50,0.4), rgba(80,80,80,0.2))',
            boxShadow: '0 1px 2px rgba(0,0,0,0.5), 0 -1px 2px rgba(0,0,0,0.5), inset 0 0 8px rgba(0,0,0,0.3)'
          }}
        ></div>
        
        {/* Enhanced selection indicator with highlight */}
        <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 pointer-events-none z-2 border-t border-b" 
          style={{ 
            borderColor: 'rgba(125,125,125,0.5)',
            borderWidth: '1px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
          }}
        ></div>
        
        {/* Light glint effect - subtle highlight */}
        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)',
            transition: 'all 0.5s ease-out'
          }}
        ></div>
        
        {/* Numbers */}
        <div 
          className="flex flex-col items-center justify-center h-full"
          ref={numbersRef}
          data-component-name="RollingNumber"
          style={{ fontFamily: 'inherit' }}
        >
          {displayedNumbers.map((num, index) => {
            // Center value is at index 4 (we have 4 before, current, 4 after)
            const position = index - 4
            const isCurrent = index === 4
            
            // Calculate cylinder effect values - create a wrapping roller appearance
            const angle = position * 22.5 // 22.5 degrees per position for circular effect
            const radius = 80 // Virtual radius of our roller drum
            
            // Calculate Z offset to create cylinder illusion
            const zOffset = Math.cos(angle * Math.PI / 180) * radius - radius
            
            // Calculate vertical position along the curved surface
            const yOffset = Math.sin(angle * Math.PI / 180) * radius
            
            return (
              <motion.div 
                key={`${num}-${index}`}
                className={`flex items-center justify-center h-10 cursor-pointer select-none touch-none ${isCurrent ? 'font-medium' : Math.abs(position) === 1 ? 'text-lg' : 'text-base'}`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  color: isCurrent ? userColor : Math.abs(position) === 1 ? '#BBBBBB' : '#888888',
                  fontFamily: 'inherit',
                  transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                  textShadow: isCurrent ? `0 0 6px ${userColor}40` : 'none',
                  backfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d'
                }}
                initial={false}
                animate={{
                  y: yOffset,
                  rotateX: angle,
                  z: zOffset,
                  opacity: isCurrent ? 1 : Math.max(0.4, 1 - Math.abs(angle/90) * 0.6),
                  scale: isCurrent ? 1.05 : 1
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  mass: 0.8,
                  duration: 0.3
                }}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.08 }}
                data-component-name={isCurrent ? "RollingNumber" : "_c"}
                onClick={() => handleNumberClick(num)}
                tabIndex={isCurrent ? 0 : -1}
                role="button"
                aria-label={`Select ${num}`}
              >
                <motion.span 
                  style={{ fontSize: isCurrent ? '1.25rem' : Math.abs(position) === 1 ? '1.125rem' : '1rem' }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {num.toString().padStart(2, '0')}
                </motion.span>
              </motion.div>
            )
          })}
        </div>
      </div>
      
      {/* Down chevron */}
      <motion.div 
        className="w-full flex justify-center mt-1 cursor-pointer select-none touch-none"
        onClick={() => updateValue(currentValue - step)}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ y: 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [0, 3, 0] }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5, ease: 'easeInOut' }}
        >
          <ChevronDown className="hover:text-white transition-colors" style={{ color: userColor }} size={24} />
        </motion.div>
      </motion.div>
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

function MobileTimePicker({ time, onTimeChange, userColor = "#03DAC6", use24HourFormat = false }: { time: string, onTimeChange: (time: string) => void, userColor?: string, use24HourFormat?: boolean }) {
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
    // Convert to 24-hour format for the time string
    let hours = timeParts.hours
    
    // Only convert if not already in 24-hour format
    if (!use24HourFormat) {
      if (timeParts.period === "PM" && hours !== 12) hours += 12
      if (timeParts.period === "AM" && hours === 12) hours = 0
    }
    
    const timeString = `${hours.toString().padStart(2, '0')}:${timeParts.minutes.toString().padStart(2, '0')}`
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

  // Parse the time string and update state when the time prop changes
  useEffect(() => {
    // Force an immediate update whenever the time prop changes
    if (time === "12:00") {
      setTimeParts({ hours: use24HourFormat ? 12 : 12, minutes: 0, period: "PM" })
    } else if (time === "00:00") {
      setTimeParts({ hours: use24HourFormat ? 0 : 12, minutes: 0, period: "AM" })
    } else {
      // Regular time update - parse hours and minutes precisely
      const [hoursStr, minutesStr] = time.split(":")
      let hours = parseInt(hoursStr, 10)
      const minutes = parseInt(minutesStr, 10)
      
      // Handle period based on 24-hour format
      const period = hours >= 12 ? "PM" : "AM"
      
      // Convert to 12-hour format if needed
      if (!use24HourFormat) {
        if (hours === 0) hours = 12
        else if (hours > 12) hours = hours - 12
      }
      
      setTimeParts({ hours, minutes, period })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time])

  // Force re-render of rollers when timeParts change
  const [forceRerender, setForceRerender] = useState(0)
  
  // When time parts change, force rollers to update
  useEffect(() => {
    setForceRerender(prev => prev + 1)
  }, [timeParts.hours, timeParts.minutes, timeParts.period])

  return (
    <div className="py-4">
      <div className="flex justify-center items-center gap-2">
        {/* Hours roller */}
        <div className="w-1/3">
          <RollingNumber 
            key={`hours-${timeParts.hours}-${forceRerender}`}
            value={timeParts.hours} 
            min={use24HourFormat ? 0 : 1} 
            max={use24HourFormat ? 23 : 12} 
            step={1} 
            onChange={handleHoursChange} 
            userColor={userColor}
          />
        </div>
        
        <div className="text-2xl font-bold">:</div>
        
        {/* Minutes roller */}
        <div className="w-1/3">
          <RollingNumber 
            key={`minutes-${timeParts.minutes}-${forceRerender}`}
            value={timeParts.minutes} 
            min={0} 
            max={59} 
            step={5} 
            onChange={handleMinutesChange} 
            userColor={userColor}
          />
        </div>
        
        {/* AM/PM toggle - only show in 12-hour mode */}
        {!use24HourFormat && (
          <motion.div 
            className="w-1/4 h-16 flex items-center justify-center cursor-pointer rounded-md select-none touch-none"
            onClick={handlePeriodToggle}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              backgroundColor: timeParts.period === 'AM' ? userColor : '#333333'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            data-component-name="MobileTimePicker"
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

function DesktopTimePicker({ time, onTimeChange, userColor = "#03DAC6", use24HourFormat = false }: { time: string, onTimeChange: (time: string) => void, userColor?: string, use24HourFormat?: boolean }) {
  // Make userColor available throughout the component
  // Separate time and period state for better control
  const [timeValue, setTimeValue] = useState('')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  
  // Initialize values from the time prop
  useEffect(() => {
    // Format the time as HH:MM and determine AM/PM
    if (time) {
      const [hoursStr, minutesStr] = time.split(":")
      let hours = parseInt(hoursStr, 10)
      const minutes = parseInt(minutesStr, 10)
      
      // Determine period
      const newPeriod = hours >= 12 ? 'PM' : 'AM'
      
      // Format for display based on 12/24 hour format
      let formattedTime = ""
      if (use24HourFormat) {
        formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      } else {
        // Convert to 12-hour format for display
        if (hours > 12) hours -= 12
        else if (hours === 0) hours = 12
        formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}`
      }
      
      setTimeValue(formattedTime)
      setPeriod(newPeriod)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, use24HourFormat])

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
    // Parse the time string
    const [hoursStr, minutesStr] = timeStr.split(":")
    let hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    
    // Convert to 24-hour format for the output if needed
    if (!use24HourFormat) {
      if (periodStr === 'PM' && hours !== 12) hours += 12
      if (periodStr === 'AM' && hours === 12) hours = 0
    }
    
    // Format the output time string
    const outputTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    onTimeChange(outputTime)
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

  // Determine the style for the AM/PM toggle based on the current period
  const amPmToggleStyles = {
    backgroundColor: period === 'AM' ? userColor : '#333333', // Match TimeInput PM background
    color: period === 'AM' ? '#222222' : userColor,
    borderColor: '#333333', // Neutral border color for both states
  }
  
  return (
    <div className="py-8 flex flex-col items-center">
      <div className="relative w-full max-w-xs">
        <input
          type="text"
          value={timeValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="text-2xl font-bold text-center border border-[#444444] rounded-lg py-4 pl-6 pr-16 w-full"
          style={{ color: userColor, backgroundColor: '#222222' }}
          placeholder="12:00"
          aria-label="Time input"
          data-component-name="DesktopTimePicker"
        />
        {!use24HourFormat && (
          <button 
            type="button"
            onClick={togglePeriod}
            className="absolute right-3 top-1/2 -translate-y-1/2 font-medium rounded-md px-3 py-1.5 transition-colors border-2 shadow-sm hover:opacity-90"
            style={amPmToggleStyles}
            aria-label="Toggle AM/PM"
            data-component-name="DesktopTimePicker"
          >
            {period === 'PM' ? (
              <span style={{ color: userColor, fontWeight: 'bold' }}>PM</span>
            ) : (
              'AM'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Global handler to prevent background scrolling on mobile
const preventBackgroundScrolling = () => {
  if (typeof window === 'undefined') return
  // Lock body scrolling when modal is open
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.touchAction = 'none'
  
  // Store the current scroll position to restore later
  const scrollY = document.documentElement.style.getPropertyValue('--scroll-y')
  document.body.style.top = `-${scrollY}`
}

// Global handler to restore background scrolling
const restoreBackgroundScrolling = () => {
  if (typeof window === 'undefined') return
  // Unlock body scrolling when modal is closed
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
  document.body.style.top = ''
  document.body.style.touchAction = ''
  
  // Restore scroll position
  const scrollY = document.body.style.top
  window.scrollTo(0, parseInt(scrollY || '0') * -1)
}

// Store scroll position for restoring later
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`)
  })
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
  const initialTimeRef = useRef(initialTime || "12:00")

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
      // Force immediate time update when dialog opens and store in ref
      const timeValue = initialTime || "12:00"
      setTime(timeValue)
      initialTimeRef.current = timeValue
      // Prevent scrolling on body when dialog is open
      preventBackgroundScrolling()
    } else {
      restoreBackgroundScrolling()
    }
    
    return () => {
      restoreBackgroundScrolling()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Don't render anything if not open
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-[#282828] rounded-lg w-full max-w-sm mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#333333]" data-component-name="TimePickerDialog">
          <div>
            <h3 className="text-xl font-semibold" data-component-name="TimePickerDialog">{title}</h3>
            {label && (
              <motion.p 
                className="text-sm mt-1 font-medium" 
                style={{ color: userColor }}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                data-component-name="TimePickerDialog"
              >
                {label}
              </motion.p>
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
              key={`mobile-picker-${initialTimeRef.current}`} 
              time={time} 
              onTimeChange={handleTimeChange} 
              userColor={userColor}
              use24HourFormat={use24HourFormat}
            />
          ) : (
            <DesktopTimePicker 
              time={time} 
              onTimeChange={handleTimeChange} 
              userColor={userColor}
              use24HourFormat={use24HourFormat}
            />
          )}
          
          {/* Preset buttons */}
          <div className="flex justify-center gap-4 mt-4 mb-4">
            <button
              type="button"
              className="px-6 py-2 rounded-md bg-[#222222] hover:bg-[#333333] text-white border border-[#444444] transition-all flex items-center gap-2"
              onClick={handleNoonClick}
              data-component-name="TimePickerDialog"
            >
              <Sun className="h-4 w-4 text-yellow-300" /> Noon
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded-md bg-[#222222] hover:bg-[#333333] text-white border border-[#444444] transition-all flex items-center gap-2"
              onClick={handleMidnightClick}
              data-component-name="TimePickerDialog"
            >
              <Moon className="h-4 w-4 text-blue-300" /> Midnight
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