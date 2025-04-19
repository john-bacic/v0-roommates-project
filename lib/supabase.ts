import { createClient } from '@supabase/supabase-js';

// The environment variables take precedence over the hardcoded values
// For local development with first Supabase instance
const defaultUrl = 'https://lzfsuovymvkkqdegiurk.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZnN1b3Z5bXZra3FkZWdpdXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzIzNzAsImV4cCI6MjA2MDMwODM3MH0.fpfKpIRbXAQLjaJ7Bz7QYphrUYbwJ8BtfkFrmdq-a6E';

// For production with second Supabase instance
const prodUrl = 'https://nwgzujsxzdprivookljo.supabase.co';
const prodKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Z3p1anN4emRwcml2b29rbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDA3NjEsImV4cCI6MjA2MDMxNjc2MX0.et6S7Lt-5PCx7YEQusfy--MZKT7s1yP3AfFoACbQurM';

// Use environment variables first, then fallback to production values, then local values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || prodUrl || defaultUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || prodKey || defaultKey;

// Create a function to get the Supabase client
// This ensures we only create the client when needed and not during server-side rendering
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  // If we already have an instance, return it
  if (supabaseInstance) return supabaseInstance;
  
  // Only create a new instance if we're in the browser
  if (typeof window !== 'undefined') {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  }
  
  // For server-side rendering, return a mock client
  // This prevents URL construction issues during SSR
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
};

// For backward compatibility
export const supabase = typeof window !== 'undefined' ? createClient(supabaseUrl, supabaseAnonKey) : getSupabase();

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
