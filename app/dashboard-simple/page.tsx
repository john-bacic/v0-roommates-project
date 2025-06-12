"use client"

import { useState, useEffect } from "react"

export default function DashboardSimple() {
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("Loading schedules...")

  useEffect(() => {
    console.log('Setting isClient to true')
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    console.log('Client-side effect triggered')
    
    // Simulate loading data
    setTimeout(() => {
      console.log('Simulated data loading complete')
      setLoading(false)
      setMessage("Schedules loaded successfully!")
    }, 1000)
  }, [isClient])

  if (!isClient) {
    return <div className="p-8 bg-[#282828] text-white">Server-side rendering...</div>
  }

  return (
    <div className="p-8 bg-[#282828] text-white min-h-screen">
      <h1 className="text-2xl mb-4">Simple Dashboard Test</h1>
      
      {loading ? (
        <p>Loading schedules...</p>
      ) : (
        <div>
          <p className="mb-4">{message}</p>
          <div className="bg-gray-700 p-4 rounded">
            <h2 className="text-lg mb-2">Mock Schedule Data</h2>
            <p>Monday: 9:00 AM - 5:00 PM</p>
            <p>Tuesday: 10:00 AM - 6:00 PM</p>
            <p>Wednesday: 9:00 AM - 5:00 PM</p>
          </div>
        </div>
      )}
    </div>
  )
} 