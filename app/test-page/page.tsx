'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestPage() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">This is a simple test page to verify the app is working correctly.</p>
      
      <div className="flex items-center gap-4 mb-8">
        <Button onClick={() => setCount(count - 1)}>-</Button>
        <span className="text-xl">{count}</span>
        <Button onClick={() => setCount(count + 1)}>+</Button>
      </div>
      
      <div className="grid gap-4">
        <Button variant="outline" asChild>
          <a href="/">Go to Home</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/overview">Go to Overview</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    </div>
  )
}
