"use client"

import { useState, useEffect } from "react"

export default function DashboardWorking() {
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("Loading schedules...")

  useEffect(() => {
    console.log('Setting isClient to true')
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    console.log('Client-side effect triggered - simulating data load')
    
    // Simulate loading data
    setTimeout(() => {
      console.log('Simulated data loading complete')
      setLoading(false)
      setMessage("Dashboard loaded successfully!")
    }, 1000)
  }, [isClient])

  return (
    <div className="p-8 bg-[#282828] text-white min-h-screen">
      <h1 className="text-2xl mb-4">Dashboard Working Test</h1>
      
      {loading ? (
        <p>Loading schedules...</p>
      ) : (
        <div>
          <p className="mb-4">{message}</p>
          <div className="bg-gray-700 p-4 rounded">
            <h2 className="text-lg mb-2">Dashboard is working!</h2>
            <p>Client-side JavaScript is executing properly.</p>
            <p>The issue was likely with Supabase imports or calls.</p>
          </div>
        </div>
      )}
    </div>
  )
} 