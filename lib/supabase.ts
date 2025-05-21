/**
 * SUPABASE CLIENT
 * 
 * A simplified Supabase client implementation that properly handles
 * browser vs server environments for the roommate scheduling app.
 * 
 * IMPORTANT: Realtime functionality is completely disabled to prevent
 * WebSocket-related errors with the free Supabase tier.
 */

import { createClient } from '@supabase/supabase-js';

// Check if we're running on the server
const isServer = typeof window === 'undefined';

// For debug logging
const debug = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Supabase] ${message}`);
  }
};

// Log errors with more detail
const logError = (message: string, error: unknown) => {
  const errorDetails = error instanceof Error 
    ? { message: error.message, stack: error.stack, name: error.name }
    : error;
  
  console.error(`[ERROR] ${message}:`, errorDetails);
};

// Simple client cache for browser environments
let browserClient: ReturnType<typeof createClient> | null = null;

/**
 * Create a mock client for server-side rendering.
 * This ensures we don't try to initialize WebSockets on the server.
 */
function createMockClient() {
  debug('Creating mock client for server-side rendering');
  
  // Return a minimal mock that won't throw errors
  return {
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: null, error: null }),
      order: () => ({ data: null, error: null }),
    }),
    auth: {
      getSession: () => null,
      onAuthStateChange: () => ({ data: null, error: null }),
    },
    // No realtime functionality in the mock
  } as any;
}

/**
 * Get a Supabase client - creates a singleton in browser environments
 * and returns a mock client in server environments.
 */
export function getSupabase(options?: { enableRealtime?: boolean }) {
  // Always return a mock client during server-side rendering
  if (isServer) {
    return createMockClient();
  }
  
  try {
    // Reuse existing client if available
    if (browserClient) {
      return browserClient;
    }
    
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or API key');
    }
    
    const clientConfig: any = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      }
    };
    
    // IMPORTANT: Completely disable Realtime functionality
    // This prevents any WebSocket-related errors
    debug('Creating client with Realtime completely disabled');
    
    // Set realtime to false to completely disable it
    clientConfig.realtime = false;
    
    // Create and cache the client
    browserClient = createClient(supabaseUrl, supabaseKey, clientConfig);
    return browserClient;
  } catch (error) {
    logError('Error creating Supabase client', error);
    // Return a mock client in case of errors
    return createMockClient();
  }
}

// Export a simple supabase instance for direct import
// Only for components that don't need realtime features
export const supabase = getSupabase();

// Define TimeBlock interface to match what's used in the app
export interface TimeBlock {
  id?: string;
  user_id: number;
  day: string;
  start_time: string;
  end_time: string;
  label: string;
  all_day: boolean;
  created_at?: string;
  date?: string;
}

// Define User interface
export interface User {
  id: number;
  name: string;
  color: string;
  initial: string;
  created_at?: string;
}

/**
 * Fetch a user's schedule from Supabase
 * @param userId The ID of the user whose schedule to fetch
 * @returns A record of day names to arrays of time blocks
 */
export async function fetchUserSchedule(userId: number): Promise<Record<string, Array<TimeBlock>>> {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      throw error;
    }
    
    // Group by day
    const scheduleByDay: Record<string, Array<TimeBlock>> = {};
    
    // Initialize days of the week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    days.forEach(day => {
      scheduleByDay[day] = [];
    });
    
    // Populate with data
    if (data) {
      data.forEach((block: TimeBlock) => {
        if (scheduleByDay[block.day]) {
          scheduleByDay[block.day].push(block);
        }
      });
    }
    
    return scheduleByDay;
  } catch (error) {
    console.error('Error fetching user schedule:', error);
    // Return empty schedule on error
    return {
      "Sunday": [],
      "Monday": [],
      "Tuesday": [],
      "Wednesday": [],
      "Thursday": [],
      "Friday": [],
      "Saturday": []
    };
  }
}
