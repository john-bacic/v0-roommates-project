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

// Simple client cache for browser environments - use a singleton pattern
let browserClient: ReturnType<typeof createClient> | null = null;
// Track if we've already warned about missing env vars
let hasWarnedAboutEnvVars = false;

/**
 * Create a mock client for server-side rendering.
 * This ensures we don't try to initialize WebSockets on the server.
 */
function createMockClient() {
  debug('Creating mock client for server-side rendering');
  
  // Return a minimal mock that won't throw errors
  return {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      gte: () => ({ data: [], error: null }),
      lte: () => ({ data: [], error: null }),
      is: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null }),
      limit: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
    }),
    auth: {
      getSession: () => null,
      onAuthStateChange: () => ({ data: null, error: null }),
    },
    // No realtime functionality in the mock
  } as any;
}

/**
 * Get the appropriate Supabase client for the current environment
 * Uses a singleton pattern to prevent multiple client instances
 */
export function getSupabase() {
  // Always check dynamically rather than using a static variable
  const isServerSide = typeof window === 'undefined';
  
  debug(`getSupabase called - isServerSide: ${isServerSide}`);
  
  if (isServerSide) {
    debug('Returning mock client for server-side');
    return createMockClient();
  }
  
  // Return existing client if we already created one
  if (browserClient !== null) {
    debug('Returning existing browser client');
    return browserClient;
  }
  
  // Client-side: create real client
  debug('Creating new Supabase client for client-side');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    if (!hasWarnedAboutEnvVars) {
      console.error('Missing Supabase environment variables on client side');
      console.error('URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('Key:', supabaseKey ? 'Set' : 'Missing');
      hasWarnedAboutEnvVars = true;
    }
    return createMockClient();
  }
  
  try {
    browserClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Disable session persistence for simplicity
      },
      realtime: {
        params: {
          eventsPerSecond: -1, // Disable realtime completely
        },
      },
    });
    
    debug('Successfully created real Supabase client');
    return browserClient;
  } catch (error) {
    logError('Failed to create Supabase client', error);
    const mockClient = createMockClient();
    return mockClient;
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
