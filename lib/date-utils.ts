/**
 * Date utilities for multi-week schedule support
 * Provides consistent week calculations and date handling across the application
 */

/**
 * Get the start and end dates of the week containing the given date
 * Week starts on Sunday (0) and ends on Saturday (6)
 */
export function getWeekBounds(date: Date): { start: Date; end: Date; startStr: string; endStr: string } {
  // Create a copy to avoid mutating the input date
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = localDate.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Set to start of week (Sunday)
  const start = new Date(localDate);
  start.setDate(localDate.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  end.setHours(23, 59, 59, 999);
  
  // Use local date formatting to avoid timezone issues
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    start,
    end,
    startStr: formatLocalDate(start),
    endStr: formatLocalDate(end)
  };
}

/**
 * Format a week as a key for storage/caching
 * Returns the ISO date string of the week's Sunday
 */
export function formatWeekKey(date: Date): string {
  const { startStr } = getWeekBounds(date);
  return startStr;
}

/**
 * Get the date for a specific day name within a week
 * @param weekDate Any date within the target week
 * @param dayName The day name (e.g., "Monday", "Tuesday")
 */
export function getDateForDayInWeek(weekDate: Date, dayName: string): string {
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  const targetDayIndex = dayMap[dayName];
  if (targetDayIndex === undefined) {
    throw new Error(`Invalid day name: ${dayName}`);
  }
  
  const { start } = getWeekBounds(weekDate);
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + targetDayIndex);
  
  // Use local date formatting to avoid timezone issues
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a week parameter from URL
 * Returns a valid Date object for the week
 */
export function parseWeekParam(weekParam: string | null): Date {
  if (!weekParam) {
    return new Date(); // Default to current week
  }
  // Parse as local date (YYYY-MM-DD)
  const [year, month, day] = weekParam.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a week range for display (e.g., "Jan 5 - Jan 11")
 */
export function formatWeekRange(date: Date): string {
  const { start, end } = getWeekBounds(date);
  
  const formatDate = (d: Date) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[d.getMonth()]} ${d.getDate()}`;
  };
  
  // If same month, show as "Jan 5 - 11"
  if (start.getMonth() === end.getMonth()) {
    return `${formatDate(start)} - ${end.getDate()}`;
  }
  
  // Different months: "Jan 28 - Feb 3"
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Get the current day name, considering early morning hours
 * Times before 6am are considered part of the previous day
 */
export function getCurrentDayName(): string {
  const now = new Date();
  const hours = now.getHours();
  
  // If it's before 6am, consider it the previous day
  let adjustedDate = new Date(now);
  if (hours < 6) {
    adjustedDate.setDate(now.getDate() - 1);
  }
  
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[adjustedDate.getDay()];
}

/**
 * Check if two dates are in the same week
 */
export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1 = formatWeekKey(date1);
  const week2 = formatWeekKey(date2);
  return week1 === week2;
}

/**
 * Get an array of dates for each day of the week
 */
export function getWeekDates(weekDate: Date): Date[] {
  const { start } = getWeekBounds(weekDate);
  const dates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

/**
 * Check if a date string represents today
 */
export function isToday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(dateStr);
  checkDate.setHours(0, 0, 0, 0);
  
  return today.getTime() === checkDate.getTime();
}

/**
 * Get the week offset from current week
 * Returns 0 for current week, -1 for last week, 1 for next week, etc.
 */
export function getWeekOffset(targetDate: Date): number {
  const currentWeek = formatWeekKey(new Date());
  const targetWeek = formatWeekKey(targetDate);
  
  const currentStart = new Date(currentWeek);
  const targetStart = new Date(targetWeek);
  
  const diffTime = targetStart.getTime() - currentStart.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.round(diffDays / 7);
}

/**
 * Get a human-readable week description
 */
export function getWeekDescription(date: Date): string {
  const offset = getWeekOffset(date);
  
  if (offset === 0) return "This Week";
  if (offset === -1) return "Last Week";
  if (offset === 1) return "Next Week";
  if (offset < 0) return `${Math.abs(offset)} weeks ago`;
  return `In ${offset} weeks`;
}