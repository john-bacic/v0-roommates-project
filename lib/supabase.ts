import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lzfsuovymvkkqdegiurk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZnN1b3Z5bXZra3FkZWdpdXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzIzNzAsImV4cCI6MjA2MDMwODM3MH0.fpfKpIRbXAQLjaJ7Bz7QYphrUYbwJ8BtfkFrmdq-a6E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
