"use client"

import { useState, useEffect } from "react"

export default function SimpleTest() {
  const [message, setMessage] = useState("Server-side rendering...")
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('Client-side useEffect triggered!')
    setMessage("Client-side JavaScript is working!")
  }, [])

  return (
    <div className="p-8 bg-[#282828] text-white min-h-screen">
      <h1 className="text-2xl mb-4">Simple Test</h1>
      <p className="mb-4">{message}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        Count: {count}
      </button>
    </div>
  )
} 