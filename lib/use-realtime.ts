/**
 * MOCK IMPLEMENTATION
 * 
 * This is a completely mocked version of the Supabase Realtime hook
 * that doesn't attempt to use any WebSocket functionality.
 * 
 * This avoids errors with the free Supabase tier and browser WebSocket issues.
 */
import { useEffect } from 'react'

interface UseRealtimeOptions {
  /** Table to subscribe to */
  table: string;
  /** Event types to listen for (insert, update, delete, etc.) */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  /** Filter for the subscription */
  filter?: Record<string, any>;
  /** Schema to use (defaults to public) */
  schema?: string;
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Callback function when data changes */
  onChange: (payload: any) => void;
}

/**
 * Mock implementation of Supabase Realtime that doesn't use WebSockets
 * This prevents errors in browser environments with the free Supabase tier
 */
export function useRealtime({
  table,
  debug = false
}: UseRealtimeOptions) {
  // Log once on mount that realtime is disabled
  useEffect(() => {
    if (debug) {
      console.log(`[Realtime:${table}] Realtime functionality is disabled - using polling fallback`)
    }
  }, [table, debug]);
  
  // Return mock values that match the expected interface
  return { 
    isSubscribed: false, 
    error: null 
  }
}
