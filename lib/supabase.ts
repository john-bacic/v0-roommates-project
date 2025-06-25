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
import { Message, MessageRead } from '../types/messages';

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
  // Always return the real Supabase client, even on the server
  try {
    // Reuse existing client if available (browser)
    if (browserClient && typeof window !== 'undefined') {
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
    clientConfig.realtime = false;
    // Create and cache the client (cache only in browser)
    if (typeof window !== 'undefined') {
      browserClient = createClient(supabaseUrl, supabaseKey, clientConfig);
      return browserClient;
    } else {
      // Always create a new client on the server
      return createClient(supabaseUrl, supabaseKey, clientConfig);
    }
  } catch (error) {
    logError('Error creating Supabase client', error);
    // Optionally, return a mock client ONLY for SSR React components, not for API/backend
    throw error;
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
  date?: string; // ISO date string (YYYY-MM-DD) for week-specific schedules
}

// Define User interface
export interface User {
  id: number;
  name: string;
  color: string;
  initial: string;
  created_at?: string;
}

// Define Schedule interface for internal use
export interface Schedule {
  id: string;
  start: string;
  end: string;
  label: string;
  allDay?: boolean;
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

import { getWeekBounds, getDateForDayInWeek } from './date-utils';

/**
 * Fetch schedules for a specific week with fallback to recurring schedules
 * @param userId The user ID (optional - if not provided, fetches for all users)
 * @param weekDate Any date within the target week
 * @returns Schedules organized by user and day
 */
export async function fetchWeekSchedules(
  weekDate: Date, 
  userId?: number
): Promise<Record<number, Record<string, Schedule[]>>> {
  try {
    const { startStr, endStr } = getWeekBounds(weekDate);
    
    // Build the base query
    let query = supabase.from('schedules').select('*');
    
    // Add user filter if provided
    if (userId !== undefined) {
      query = query.eq('user_id', userId);
    }
    
    // Only get date-specific schedules for this week
    const { data: dateSpecific, error: dateError } = await query
      .gte('date', startStr)
      .lte('date', endStr);
    
    if (dateError) {
      console.error('Error fetching date-specific schedules:', dateError);
    }
    
    // Only use date-specific schedules - no recurring schedules
    const schedulesByUserAndDay: Record<number, Record<string, Schedule[]>> = {};
    
    // Process date-specific schedules only
    if (dateSpecific) {
      dateSpecific.forEach((block: TimeBlock) => {
        if (!schedulesByUserAndDay[block.user_id]) {
          schedulesByUserAndDay[block.user_id] = {};
        }
        if (!schedulesByUserAndDay[block.user_id][block.day]) {
          schedulesByUserAndDay[block.user_id][block.day] = [];
        }
        
        schedulesByUserAndDay[block.user_id][block.day].push({
          id: block.id || '',
          start: block.start_time,
          end: block.end_time,
          label: block.label,
          allDay: block.all_day
        });
      });
    }
    
    return schedulesByUserAndDay;
  } catch (error) {
    console.error('Error in fetchWeekSchedules:', error);
    return {};
  }
}

/**
 * Save a schedule with week context
 * @param schedule The schedule data to save
 * @param weekDate The week context for this schedule
 */
export async function saveScheduleWithWeek(
  schedule: Omit<TimeBlock, 'id' | 'created_at'>,
  weekDate: Date
): Promise<{ data: TimeBlock | null; error: any }> {
  try {
    // Calculate the specific date for this day in the week
    const date = getDateForDayInWeek(weekDate, schedule.day);
    
    const scheduleWithDate = {
      ...schedule,
      date // Add the specific date
    };
    
    const { data, error } = await supabase
      .from('schedules')
      .insert(scheduleWithDate)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error saving schedule with week:', error);
    return { data: null, error };
  }
}

/**
 * Update a schedule with week context
 */
export async function updateScheduleWithWeek(
  scheduleId: string,
  updates: Partial<TimeBlock>,
  weekDate: Date
): Promise<{ data: TimeBlock | null; error: any }> {
  try {
    // If day is being updated, recalculate the date
    let updateData = { ...updates };
    if (updates.day && weekDate) {
      updateData.date = getDateForDayInWeek(weekDate, updates.day);
    }
    
    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Error updating schedule with week:', error);
    return { data: null, error };
  }
}

/**
 * Fetch all messages with sender info and read status
 * @param userId Current user ID to check read status
 */
export async function fetchMessages(userId: number): Promise<Message[]> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, name, color, initial),
        message_reads(user_id, read_at, user:users(id, name, initial))
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Process messages to add is_read flag
    return (messages || []).map((msg: any) => ({
      ...msg,
      is_read: msg.message_reads?.some((read: any) => read.user_id === userId) || false,
      read_by: msg.message_reads || []
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

/**
 * Send a new message
 * @param senderId The ID of the user sending the message
 * @param content The message content
 */
export async function sendMessage(senderId: number, content: string): Promise<Message | null> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, content })
      .select();

    console.log('[sendMessage] data:', data);
    console.log('[sendMessage] error:', error);

    if (error) throw error;
    return data && data[0] ? data[0] : null;
  } catch (error) {
    console.error('[sendMessage] Caught error:', error);
    throw error;
  }
}

/**
 * Mark a message as read
 * @param messageId The message ID
 * @param userId The user ID marking as read
 */
export async function markMessageAsRead(messageId: string, userId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('message_reads')
      .insert({ message_id: messageId, user_id: userId });

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
}

/**
 * Delete a message (soft delete)
 * @param messageId The message ID to delete
 * @param userId The user ID attempting to delete
 */
export async function deleteMessage(messageId: string, userId: number): Promise<boolean> {
  try {
    console.log('[deleteMessage] Attempting to delete message:', { messageId, userId });
    
    // First, let's check if the message exists and who owns it
    const { data: checkData, error: checkError } = await supabase
      .from('messages')
      .select('id, sender_id, content')
      .eq('id', messageId)
      .single();
    
    console.log('[deleteMessage] Message check:', { checkData, checkError });
    
    if (checkError) {
      console.log('[deleteMessage] Error checking message:', checkError);
      return false;
    }
    
    if (!checkData) {
      console.log('[deleteMessage] Message not found');
      return false;
    }
    
    if (checkData.sender_id !== userId) {
      console.log('[deleteMessage] User does not own this message:', { 
        messageSenderId: checkData.sender_id, 
        requestUserId: userId 
      });
      return false;
    }
    
    // Perform the actual soft delete
    const { data, error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)
      .select();

    console.log('[deleteMessage] Update response:', { data, error });

    if (error) throw error;
    
    // Check if any rows were affected
    if (!data || data.length === 0) {
      console.log('[deleteMessage] No rows were updated');
      return false;
    }
    
    console.log('[deleteMessage] Successfully deleted message');
    return true;
    
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}

/**
 * Get unread message count for a user
 * @param userId The user ID
 */
export async function getUnreadMessageCount(userId: number): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_unread_message_count', { p_user_id: userId });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

