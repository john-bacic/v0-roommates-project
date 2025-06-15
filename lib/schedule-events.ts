/**
 * Centralized event system for schedule synchronization
 * Ensures all screens stay in sync when schedules are updated
 */

export type ScheduleEventType = 
  | 'schedule-updated'
  | 'week-changed'
  | 'user-color-changed'
  | 'sync-required';

export interface ScheduleEvent {
  type: ScheduleEventType;
  detail: {
    userId?: number;
    weekDate?: Date;
    dayName?: string;
    source?: string; // Which component triggered the event
    timestamp?: number;
  };
}

class ScheduleEventBus {
  private listeners: Map<ScheduleEventType, Set<(event: ScheduleEvent) => void>> = new Map();
  
  /**
   * Subscribe to schedule events
   */
  on(eventType: ScheduleEventType, callback: (event: ScheduleEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }
  
  /**
   * Emit a schedule event
   */
  emit(event: ScheduleEvent) {
    // Add timestamp if not provided
    if (!event.detail.timestamp) {
      event.detail.timestamp = Date.now();
    }
    
    // Log for debugging
    console.log(`[ScheduleEvents] Emitting ${event.type}`, event.detail);
    
    // Notify listeners for this event type
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[ScheduleEvents] Error in listener for ${event.type}:`, error);
        }
      });
    }
    
    // Also dispatch a DOM event for components that prefer that approach
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }));
    }
  }
  
  /**
   * Request a full sync across all components
   */
  requestSync(source: string) {
    this.emit({
      type: 'sync-required',
      detail: { source }
    });
  }
}

// Create singleton instance
export const scheduleEvents = new ScheduleEventBus();

/**
 * React hook for using schedule events
 */
export function useScheduleEvents() {
  return scheduleEvents;
}

/**
 * Helper to emit schedule update event
 */
export function emitScheduleUpdate(userId: number, weekDate: Date, dayName?: string, source?: string) {
  scheduleEvents.emit({
    type: 'schedule-updated',
    detail: { userId, weekDate, dayName, source }
  });
}

/**
 * Helper to emit week change event
 */
export function emitWeekChange(weekDate: Date, source?: string) {
  scheduleEvents.emit({
    type: 'week-changed',
    detail: { weekDate, source }
  });
}

/**
 * Helper to emit user color change event
 */
export function emitUserColorChange(userId: number, source?: string) {
  scheduleEvents.emit({
    type: 'user-color-changed',
    detail: { userId, source }
  });
}