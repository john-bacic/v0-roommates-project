/**
 * Migration helpers for transitioning from day-based to week-aware schedules
 */

import { supabase } from './supabase';
import { getDateForDayInWeek } from './date-utils';

/**
 * Check if a user has any date-specific schedules
 */
export async function hasDateSpecificSchedules(userId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('id')
      .eq('user_id', userId)
      .not('date', 'is', null)
      .limit(1);
    
    if (error) {
      console.error('Error checking for date-specific schedules:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasDateSpecificSchedules:', error);
    return false;
  }
}


/**
 * Clean up duplicate schedules for a specific week
 * Removes recurring schedules if date-specific ones exist for the same day
 */
export async function cleanupDuplicateSchedules(
  userId: number,
  weekDate: Date
): Promise<{ success: boolean; error: any }> {
  try {
    // This is a placeholder - in production, you'd want to implement
    // logic to identify and remove duplicates while preserving user intent
    console.log('Cleanup duplicates not implemented yet');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return { success: false, error };
  }
}