'use client'
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
 
export default function Error({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])
 
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-gray-500">
          We encountered an error while loading the application. Please try again.
        </p>
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
