"use client"

import { useState, useEffect } from "react"
import { CircularTimePicker } from "./circular-time-picker"
import { X } from "lucide-react"

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
        <div className="p-6">
          <CircularTimePicker
            id="dialog-time-picker"
            value={time}
            onChange={handleTimeChange}
            userColor={userColor}
          />
          
          <div className="flex justify-center mt-6">
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
