import { createClient } from '@supabase/supabase-js';

// Use constants without any markdown or special formatting that might cause URL parsing issues

// For local development with first Supabase instance
// Using string literals to ensure clean URLs without any hidden characters
const defaultUrl = `https://lzfsuovymvkkqdegiurk.supabase.co`;
const defaultKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZnN1b3Z5bXZra3FkZWdpdXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzIzNzAsImV4cCI6MjA2MDMwODM3MH0.fpfKpIRbXAQLjaJ7Bz7QYphrUYbwJ8BtfkFrmdq-a6E`;

// For production with second Supabase instance
const prodUrl = `https://nwgzujsxzdprivookljo.supabase.co`;
const prodKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM`;

// Determine which URL and key to use
// Try to avoid any URL construction that might fail
let supabaseUrl: string;
let supabaseAnonKey: string;

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.trim() !== '') {
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
} else if (prodUrl) {
  supabaseUrl = prodUrl;
} else {
  supabaseUrl = defaultUrl;
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() !== '') {
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
} else if (prodKey) {
  supabaseAnonKey = prodKey;
} else {
  supabaseAnonKey = defaultKey;
}

// We'll completely avoid creating any URL objects during server-side rendering
// Instead, we'll create a proper browser-only client with proper checks

// This variable will store our singleton client instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Creates and returns a Supabase client, or a mock client during server-side rendering
 */
export const getSupabase = () => {
  // If we already have a client instance, return it
  if (supabaseInstance) return supabaseInstance;
  
  // Check if we're in the browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Only create a real client in the browser
  if (isBrowser) {
    try {
      // Create a real Supabase client with our cleanly formatted URLs
      // No URL manipulation - just use the strings directly
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
      return supabaseInstance;
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      // Return a mock client if creation fails
      return createMockClient();
    }
  }
  
  // For server-side rendering, return a mock client
  return createMockClient();
};

/**
 * Creates a mock Supabase client for server-side rendering
 */
function createMockClient() {
  return {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      eq: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
    }),
    removeChannel: () => {},
  } as unknown as ReturnType<typeof createClient>;
}

// For backward compatibility, ONLY create client when in browser
// Never during server-side rendering to avoid URL parse errors
export const supabase = typeof window === 'undefined' 
  ? createMockClient() 
  : (() => {
      try {
        // Directly use the clean URL strings without any manipulation
        // This should prevent URL parsing errors
        return createClient(supabaseUrl, supabaseAnonKey);
      } catch (error) {
        console.error('Error creating Supabase client:', error);
        return createMockClient();
      }
    })();

// User type definition
export interface User {
  id: number;
  name: string;
  color: string;
  initial: string;
}

// Schedule type definition
export interface TimeBlock {
  id?: string;
  start: string;
  end: string;
  label: string;
  allDay?: boolean;
}

export type UserSchedule = Record<string, Array<TimeBlock>>;

// Function to fetch all users
export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data || [];
}

// Function to fetch a user's schedule
export async function fetchUserSchedule(userId: number): Promise<UserSchedule> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error(`Error fetching schedule for user ${userId}:`, error);
    return {};
  }
  
  // Transform the flat data into the required structure
  const schedule: UserSchedule = {};
  
  data?.forEach(item => {
    if (!schedule[item.day]) {
      schedule[item.day] = [];
    }
    
    schedule[item.day].push({
      id: item.id,
      start: item.start_time,
      end: item.end_time,
      label: item.label,
      allDay: item.all_day
    });
  });
  
  return schedule;
}

// Function to save a user's schedule
export async function saveUserSchedule(
  userId: number, 
  day: string, 
  timeBlock: TimeBlock
): Promise<boolean> {
  // If timeBlock has an id, update the existing record
  if (timeBlock.id) {
    const { error } = await supabase
      .from('schedules')
      .update({
        start_time: timeBlock.start,
        end_time: timeBlock.end,
        label: timeBlock.label,
        all_day: timeBlock.allDay || false
      })
      .eq('id', timeBlock.id);
    
    if (error) {
      console.error('Error updating schedule:', error);
      return false;
    }
    
    return true;
  }
  
  // Otherwise, insert a new record
  const { error } = await supabase
    .from('schedules')
    .insert({
      user_id: userId,
      day: day,
      start_time: timeBlock.start,
      end_time: timeBlock.end,
      label: timeBlock.label,
      all_day: timeBlock.allDay || false
    });
  
  if (error) {
    console.error('Error inserting schedule:', error);
    return false;
  }
  
  return true;
}

// Function to delete a time block
export async function deleteTimeBlock(timeBlockId: string): Promise<boolean> {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', timeBlockId);
  
  if (error) {
    console.error('Error deleting time block:', error);
    return false;
  }
  
  return true;
}

// Function to update a user's color
export async function updateUserColor(userId: number, color: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ color })
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating user color:', error);
    return false;
  }
  
  return true;
}
