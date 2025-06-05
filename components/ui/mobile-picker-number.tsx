"use client"

import React, { useState, useEffect, useRef } from "react"
import Picker, { PickerValue } from "react-mobile-picker"
import { motion } from "framer-motion"

interface MobilePickerNumberProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  userColor?: string
  format?: (value: number) => string
}

export function MobilePickerNumber({
  value,
  min,
  max,
  step = 1,
  onChange,
  userColor = "#FFFFFF",
  format = (val) => val.toString().padStart(2, '0')
}: MobilePickerNumberProps) {
  // Use refs to track previous values and prevent unnecessary updates
  const prevValueRef = useRef(value)
  const isInitialMount = useRef(true)
  
  // Generate options only once and store in ref
  const optionsRef = useRef<string[]>([])
  if (optionsRef.current.length === 0) {
    for (let i = min; i <= max; i += step) {
      optionsRef.current.push(format(i))
    }
  }
  
  // Use state only for the picker value
  const [pickerValue, setPickerValue] = useState<PickerValue>({ value: format(value) })
  
  // Update picker value only when the external value changes
  useEffect(() => {
    // Skip the first render
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    // Only update if the value has actually changed
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      setPickerValue({ value: format(value) })
    }
  }, [value, format])
  
  // Handle value change from picker
  const handleValueChange = (newValue: PickerValue) => {
    if (pickerValue.value === newValue.value) return
    
    setPickerValue(newValue)
    // Find the actual number value that corresponds to the formatted string
    for (let i = min; i <= max; i += step) {
      if (format(i) === newValue.value) {
        onChange(i)
        break
      }
    }
  }
  
  // Custom inline styles for the picker
  const pickerInlineStyles = {
    height: 128, // Match the container height
    itemHeight: 32
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Up chevron - optional, can be removed if not needed */}
      <motion.div 
        className="w-full flex justify-center mb-1 cursor-pointer select-none touch-none"
        onClick={() => {
          // Find current index and move to next value
          const currentIndex = optionsRef.current.indexOf(pickerValue.value as string)
          const nextIndex = (currentIndex + 1) % optionsRef.current.length
          const newValue = optionsRef.current[nextIndex]
          handleValueChange({ value: newValue })
        }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={userColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </motion.div>
      
      {/* Picker */}
      <div
        className="h-32 overflow-hidden bg-[#1e1e1e] border border-[#333333] rounded-lg relative select-none w-full touch-none flex items-center justify-center"
        style={{
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <Picker
            value={pickerValue}
            onChange={handleValueChange}
            height={pickerInlineStyles.height}
            itemHeight={pickerInlineStyles.itemHeight}
            wheelMode="normal"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Picker.Column name="value">
              {optionsRef.current.map((option: string) => (
                <Picker.Item key={option} value={option}>
                  {({ selected }) => (
                    <div
                      style={{
                        color: selected ? userColor : '#888888',
                        fontSize: selected ? '20px' : '16px',
                        fontWeight: selected ? '500' : 'normal',
                        padding: '0 10px',
                        textAlign: 'center',
                        width: '100%',
                        height: '32px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: selected ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {option}
                    </div>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>
          </Picker>
        </div>
      </div>
      
      {/* Down chevron - optional, can be removed if not needed */}
      <motion.div 
        className="w-full flex justify-center mt-1 cursor-pointer select-none touch-none"
        onClick={() => {
          // Find current index and move to previous value
          const currentIndex = optionsRef.current.indexOf(pickerValue.value as string)
          const prevIndex = (currentIndex - 1 + optionsRef.current.length) % optionsRef.current.length
          const newValue = optionsRef.current[prevIndex]
          handleValueChange({ value: newValue })
        }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ y: 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={userColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </motion.div>
    </div>
  )
}
