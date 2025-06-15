/**
 * Shared TypeScript types for the schedule application
 */

export interface User {
  id: number;
  name: string;
  color: string;
  initial: string;
}

export interface TimeBlock {
  id?: string;
  start: string;
  end: string;
  label: string;
  allDay?: boolean;
}

export interface ScheduleRecord {
  id: string;
  user_id: number;
  day: string;
  date?: string; // ISO date string (YYYY-MM-DD)
  start_time: string;
  end_time: string;
  label: string;
  all_day: boolean;
  created_at?: string;
}

export type DayName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type UserSchedule = Record<DayName, TimeBlock[]>;
export type SchedulesType = Record<number, UserSchedule>;

export interface WeekContext {
  weekDate: Date;
  weekKey: string;
  weekStart: Date;
  weekEnd: Date;
  isCurrentWeek: boolean;
  weekDescription: string;
}