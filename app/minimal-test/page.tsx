"use client"

import { useState, useEffect } from "react"

export default function MinimalTest() {
  const [message, setMessage] = useState("Server-side rendering...")

  useEffect(() => {
    console.log('Client-side useEffect triggered!')
    setMessage("Client-side JavaScript is working!")
  }, [])

  return (
    <div style={{ padding: '32px', backgroundColor: '#282828', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Minimal Test</h1>
      <p style={{ marginBottom: '16px' }}>{message}</p>
    </div>
  )
} 