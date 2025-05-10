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
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragCurrentY, setDragCurrentY] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const [currentValue, setCurrentValue] = useState(value)
  const [lastMoveTime, setLastMoveTime] = useState(0)
  const [lastMoveY, setLastMoveY] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [touchSensitivity, setTouchSensitivity] = useState(1) // For mobile sensitivity
  const [lastSwipeDirection, setLastSwipeDirection] = useState<number | null>(null) // Track swipe direction
  
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
      
      // Add touch-action: none to prevent browser handling of touch events
      container.style.touchAction = 'none'
      
      // Detect if we're on mobile and set higher sensitivity
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        setTouchSensitivity(1.8) // More responsive on mobile devices
      }
      
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
    // Always update on mount or when value changes
    setCurrentValue(value)
    generateNumbers(value)
  }, [value])
  
  // Initialize numbers on first render and whenever value changes
  useEffect(() => {
    generateNumbers(currentValue)
  }, [currentValue])
  
  // Handle mouse/touch events with improved tactile feedback
  const handleStartDrag = (clientY: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    // Add a try-catch block to handle any potential errors
    try {
      setIsDragging(true)
      setDragStartY(clientY)
      setDragCurrentY(clientY)
      setLastMoveTime(Date.now())
      setLastMoveY(clientY)
      setVelocity(0)
      setAnimating(false)
      
      // Add haptic feedback if available
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate(5) // Subtle vibration for 5ms
      }
      
      // Visual feedback - highlight the container
      const container = containerRef.current
      if (container) {
        container.style.borderColor = userColor
      }
    } catch (error) {
      console.error('Error in handleStartDrag:', error)
    }
  }
  
  const handleMoveDrag = (clientY: number) => {
    try {
      if (!isDragging) return
      
      setDragCurrentY(clientY)
      
      // Calculate distance moved
      const deltaY = clientY - dragStartY
      
      // Apply sensitivity multiplier (higher for mobile)
      const effectiveDelta = deltaY * touchSensitivity
      
      // Calculate exact value change based on drag distance
      // Each "step" is 40px, so we divide by 40 to get the number of steps
      const valueChange = effectiveDelta / 40
      
      // Calculate velocity (pixels per millisecond)
      const currentTime = Date.now()
      const timeDelta = currentTime - lastMoveTime
      if (timeDelta > 0) {
        const distanceDelta = clientY - lastMoveY
        const newVelocity = distanceDelta / timeDelta
        // Apply smoothing to velocity updates
        setVelocity(prev => prev * 0.7 + newVelocity * 0.3)
      }
      
      // Update tracking variables
      setLastMoveTime(currentTime)
      setLastMoveY(clientY)
      
      // Update value based on drag distance - invert for more intuitive control
      // Dragging up should increase the value, down should decrease
      updateValue(currentValue - (valueChange * step))
      
      // Reset start position to avoid jumps, but keep some memory
      // of the movement for better momentum feel
      setDragStartY(prev => prev * 0.3 + clientY * 0.7)
    } catch (error) {
      console.error('Error in handleMoveDrag:', error)
      setDragStartY(clientY)
    }
  }
  
  const handleEndDrag = () => {
    if (!isDragging) return
    
    setIsDragging(false)
    
    // Reset border color when drag ends
    const container = containerRef.current
    if (container) {
      container.style.borderColor = '#333333'
    }
    
    // Apply enhanced momentum scrolling with better physics
    if (Math.abs(velocity) > 0.05) { // Lower threshold for more responsive feel
      setAnimating(true)
      
      let lastFrameTime = Date.now()
      let currentVelocity = velocity
      let accumulatedChange = 0
      let totalRotation = 0
      
      // Create a physics-based animation with realistic roller momentum
      const animate = (timestamp: number) => {
        if (!animating) {
          return
        }
        
        // Calculate time since last frame
        const deltaTime = timestamp - lastFrameTime
        lastFrameTime = timestamp
        
        // Calculate physical properties for realistic roller motion
        // Roller drum physics: higher initial momentum with non-linear friction
        const initialMomentumBoost = Math.min(1.2, 1 + (Math.abs(currentVelocity) * 2))
        const inertia = 0.9 + Math.min(0.08, Math.abs(currentVelocity) * 0.5) // Higher inertia for faster initial speed
        
        // Apply non-linear deceleration with physical friction model
        // Gradually increasing friction as it slows (simulating bearing friction)
        const frictionFactor = Math.pow(inertia, deltaTime / 16) 
        const damping = 1 - Math.min(0.05, Math.abs(1 / (currentVelocity + 0.1) * 0.01))
        
        // Apply physics calculations
        currentVelocity *= frictionFactor * damping * initialMomentumBoost
        
        // Track total rotation for oscillation effects
        totalRotation += currentVelocity * (deltaTime / 16)
        
        // Accumulate partial changes with micro-oscillations for realistic feel
        accumulatedChange += currentVelocity * (deltaTime / 16)
        
        // Apply slight oscillation at the end for authentic roller feel
        const oscillation = Math.abs(currentVelocity) < 0.15 ? 
          Math.sin(totalRotation * 30) * 0.02 * Math.min(1, Math.abs(currentVelocity) * 10) : 0
        
        // Only update value when accumulated change is significant
        if (Math.abs(accumulatedChange + oscillation) >= 0.25) {
          const valueChange = Math.sign(accumulatedChange) * 0.25
          updateValue(currentValue + valueChange * step)
          accumulatedChange -= valueChange
          
          // Provide subtle haptic feedback during momentum scrolling
          if (Math.random() < 0.1 && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(2) // Very subtle
          }
        }
        
        // Stop when velocity becomes very small
        if (Math.abs(currentVelocity) < 0.03) {
          // Final snap to nearest valid value with subtle haptics
          const roundedValue = Math.round(currentValue / step) * step
          updateValue(roundedValue)
          setAnimating(false)
          
          // Final snap feedback
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(5)
          }
          
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
          }
          return
        }
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    } else {
      // If no significant velocity, just snap to nearest value with feedback
      const roundedValue = Math.round(currentValue / step) * step
      updateValue(roundedValue)
      
      // Provide haptic feedback for the snap
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(3)
      }
    }
  }
  
  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStartDrag(e.clientY)
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      handleMoveDrag(e.clientY)
    }
  }
  
  const handleMouseUp = () => {
    handleEndDrag()
  }
  
  // Enhanced touch event handlers for mobile swipe gestures with better vertical detection
  const handleTouchStart = (e: React.TouchEvent) => {
    try {
      // Prevent any potential browser handling that might interfere
      if (e.cancelable) {
        e.preventDefault()
      }
      
      // Start the drag operation
      handleStartDrag(e.touches[0].clientY)
      
      // Visual feedback - highlight the border
      if (containerRef.current) {
        containerRef.current.style.borderColor = userColor
        containerRef.current.style.boxShadow = `0 0 8px ${userColor}40`
      }
      
      // Reset swipe direction tracking on new touch
      setLastSwipeDirection(null)
      
      // Set a higher touch sensitivity specifically for mobile swipes
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        setTouchSensitivity(2.2) // Even more responsive on mobile for quick swipes
      }
      
      // Provide haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(5) // Subtle vibration
      }
    } catch (error) {
      console.error('Error in handleTouchStart:', error)
    }
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      // Always prevent default during drag to stop page scrolling
      e.preventDefault()
      
      // Get current touch position
      const touchY = e.touches[0].clientY
      
      // Calculate distance moved
      const distance = touchY - dragStartY
      const absDistance = Math.abs(distance)
      
      // Determine direction (positive = down, negative = up)
      const direction = Math.sign(distance)
      
      // Check if direction changed during this drag
      const directionChanged = lastSwipeDirection !== null && direction !== lastSwipeDirection
      
      // Update the last swipe direction
      setLastSwipeDirection(direction)
      
      // Apply acceleration for faster response with touchSensitivity
      // Shorter movements get higher acceleration for responsiveness
      const accelerationFactor = Math.min(3.0, 1 + (absDistance / 50)) * touchSensitivity
      
      // Apply the accelerated movement
      handleMoveDrag(dragStartY + (distance * accelerationFactor))
      
      // Determine if we should provide haptic feedback
      // Based on crossing number thresholds
      const valueChange = Math.floor(absDistance / 40)
      if (valueChange > 0 && valueChange % 1 === 0) {
        // Provide subtle haptic feedback when crossing number boundaries
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(2)
        }
      }
    }
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    try {
      // Reset the visual feedback when touch ends
      if (containerRef.current) {
        containerRef.current.style.borderColor = '#333333'
        containerRef.current.style.boxShadow = 'none'
      }
      
      if (isDragging) {
        // Calculate the time and distance of the swipe
        const endTime = Date.now()
        const swipeTime = endTime - lastMoveTime
        const swipeDistance = Math.abs(lastMoveY - dragStartY)
        const direction = Math.sign(dragStartY - lastMoveY) // Reverse for intuitive direction
        
        // Handle different types of swipes
        if (swipeTime < 100 && swipeDistance > 5) {
          // Very quick flick - immediately jump one or more steps
          const jumpSteps = Math.min(3, Math.floor(swipeDistance / 20))
          
          // Update value directly for immediate feedback
          updateValue(currentValue + (direction * jumpSteps * step))
          
          // Add haptic feedback for the jump
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([5, 10, 5]) // Pulsed haptic feedback for jumps
          }
          
          // Skip momentum scrolling for very short, fast swipes
          if (swipeDistance < 30) {
            setIsDragging(false)
            return
          }
          
          // For longer swipes, add extra velocity for momentum
          const boostFactor = 5.0 * touchSensitivity * (jumpSteps / 2)
          setVelocity(velocity => velocity + (direction * boostFactor))
        } 
        else if (swipeTime < 300 && swipeDistance > 10) {
          // Medium-speed swipe - boost momentum
          const boostFactor = 3.0 * touchSensitivity
          setVelocity(velocity => velocity + (direction * boostFactor))
        }
        
        // Apply momentum scrolling
        handleEndDrag()
        
        // Provide haptic confirmation based on swipe intensity
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          if (swipeDistance > 50) {
            navigator.vibrate(15) // Stronger feedback for bigger swipes
          } else {
            navigator.vibrate(8) // Subtle feedback for smaller swipes
          }
        }
      }
    } catch (error) {
      console.error('Error in handleTouchEnd:', error)
    }
  }
  
  // Handle direct click on a number
  const handleNumberClick = (num: number) => {
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
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out'
        }}
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
        
        {/* Enhanced selection indicator with dynamic highlight */}
        <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 pointer-events-none z-2 border-t border-b" 
          style={{ 
            borderColor: isDragging ? userColor : 'rgba(125,125,125,0.5)',
            borderWidth: isDragging ? '1.5px' : '1px',
            boxShadow: isDragging 
              ? `0 0 12px ${userColor}60, inset 0 0 6px ${userColor}30` 
              : 'inset 0 1px 3px rgba(0,0,0,0.3)',
            transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
          }}
        ></div>
        
        {/* Light glint effect - subtle highlight that moves during interaction */}
        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-20"
          style={{
            background: isDragging 
              ? `linear-gradient(${45 + (dragCurrentY - dragStartY) / 5}deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)` 
              : 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)',
            transition: isDragging ? 'none' : 'all 0.5s ease-out'
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
                  type: isDragging ? 'tween' : 'spring',
                  stiffness: isDragging ? undefined : 300,
                  damping: isDragging ? undefined : 20,
                  mass: isDragging ? undefined : 0.8,
                  duration: isDragging ? 0 : 0.3
                }}
                whileTap={isCurrent ? { scale: 0.95 } : undefined}
                data-component-name={isCurrent ? "RollingNumber" : "_c"}
                onClick={() => handleNumberClick(num)}
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

  // Parse the time string and update state when the time prop changes
  useEffect(() => {
    // Force an immediate update whenever the time prop changes
    if (time === "12:00") {
      setTimeParts({ hours: 12, minutes: 0, period: "PM" })
    } else if (time === "00:00") {
      setTimeParts({ hours: 12, minutes: 0, period: "AM" })
    } else {
      // Regular time update - parse hours and minutes precisely
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
            min={1} 
            max={12} 
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
        
        {/* AM/PM toggle - shorter version */}
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
      </div>
    </div>
  )
}

function DesktopTimePicker({ time, onTimeChange, userColor = "#03DAC6" }: { time: string, onTimeChange: (time: string) => void, userColor?: string }) {
  // Make userColor available throughout the component
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

  // Determine the style for the AM/PM toggle based on the current period
  const amPmToggleStyles = {
    backgroundColor: period === 'AM' ? userColor : '#444444',
    color: period === 'AM' ? '#222222' : userColor,
    borderColor: period === 'AM' ? '#222222' : userColor,
  }
  
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
          className="absolute right-3 top-1/2 -translate-y-1/2 font-medium rounded-md px-3 py-1.5 transition-colors border-2 shadow-sm hover:opacity-90"
          style={amPmToggleStyles}
          aria-label="Toggle AM/PM"
          data-component-name="DesktopTimePicker"
        >
          {period}
        </button>
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
            />
          ) : (
            <DesktopTimePicker 
              time={time} 
              onTimeChange={handleTimeChange} 
              userColor={userColor}
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