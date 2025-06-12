"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"

export default function TestSupabase() {
  const [isClient, setIsClient] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Setting isClient to true')
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    console.log('Client-side test starting...')
    
    const testSupabase = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Testing users fetch...')
        const { data: usersData, error: usersError } = await getSupabase()
          .from('users')
          .select('*')
        
        console.log('Users result:', { data: usersData, error: usersError })
        
        if (usersError) {
          throw new Error(`Users error: ${usersError.message}`)
        }
        
        setUsers(usersData || [])
        
        console.log('Testing schedules fetch...')
        const { data: schedulesData, error: schedulesError } = await getSupabase()
          .from('schedules')
          .select('*')
          .limit(5)
        
        console.log('Schedules result:', { data: schedulesData, error: schedulesError })
        
        if (schedulesError) {
          throw new Error(`Schedules error: ${schedulesError.message}`)
        }
        
        setSchedules(schedulesData || [])
        
      } catch (err) {
        console.error('Test error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    testSupabase()
  }, [isClient])

  if (!isClient) {
    return <div>Server-side rendering...</div>
  }

  return (
    <div className="p-8 bg-[#282828] text-white min-h-screen">
      <h1 className="text-2xl mb-4">Supabase Client Test</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-600 p-4 rounded mb-4">
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl mb-2">Users ({users.length}):</h2>
            <pre className="bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(users, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="text-xl mb-2">Schedules ({schedules.length}):</h2>
            <pre className="bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(schedules, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
} 