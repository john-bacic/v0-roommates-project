# Multi-Week Schedule Support Project Plan

## Project Overview
Enable the Roomeez application to support different schedules for different weeks while maintaining perfect synchronization between dashboard, edit, and overview screens with minimal UI changes.

## Current State Analysis

### Database Structure
- **schedules** table has a `date` column (added via migration) but it's currently unused
- Schedules are stored with day names only ("Monday", "Tuesday", etc.)
- No week-specific data is currently saved or retrieved

### Current Behavior
- All weeks show the same schedule (recurring weekly schedule)
- Week navigation exists but only changes the displayed date range
- Synchronization happens through polling, visibility events, and custom events

### Key Challenges
1. Transition from day-based to date-based storage without breaking existing data
2. Maintain backward compatibility with existing schedules
3. Ensure all three screens (dashboard, edit, overview) stay in sync
4. Minimal UI changes requirement
5. Handle edge cases (week boundaries, timezone issues)

## Technical Approach

### Core Strategy
1. **Hybrid Storage Model**: Support both recurring (day-based) and date-specific schedules
2. **Week Context**: Add week parameter to all relevant URLs and components
3. **Smart Data Loading**: Load date-specific schedules if they exist, fall back to recurring schedules
4. **Unified Sync System**: Create a central synchronization mechanism

## Implementation Phases

### Phase 1: Database and Data Model Updates ✅ Checkpoint 1
**Goal**: Enable date-based schedule storage while maintaining backward compatibility

#### Tasks:
1. ✅ Create database helper functions for week calculations
2. ✅ Add week utility functions (getWeekBounds, formatWeekKey, etc.)
3. ✅ Create migration strategy for existing data
4. ✅ Update Supabase TypeScript interfaces

#### Deliverables:
- [x] `lib/date-utils.ts` - Centralized date/week utilities
- [x] Updated `lib/supabase.ts` with new interfaces
- [x] Database helper functions for week queries
- [x] `lib/schedule-migration.ts` - Migration helpers
- [x] `types/schedule.ts` - Centralized TypeScript types
- [x] `lib/schedule-events.ts` - Event system for synchronization

### Phase 2: Week-Aware Data Loading ✅ Checkpoint 2
**Goal**: Update all data loading to be week-aware

#### Tasks:
1. ✅ Update dashboard data loading to filter by week
2. ✅ Update edit page to load schedules for specific week
3. ✅ Update overview page to respect week context
4. ✅ Implement fallback logic (date-specific → recurring)

#### Deliverables:
- [x] Week-aware `loadSchedules` functions
- [x] Consistent week parameter handling
- [x] Fallback mechanism implementation

### Phase 3: Week-Aware Data Saving ✅ Checkpoint 3
**Goal**: Save schedules with proper date context

#### Tasks:
1. ✅ Update edit page to save with date field
2. ✅ Update WeeklySchedule component save logic
3. ✅ Update ScheduleEditor component save logic
4. ✅ Ensure all saves include proper week context

#### Deliverables:
- [x] Date-aware save functions
- [x] Proper date field population
- [x] Week context preservation

### Phase 4: URL and Navigation Updates ✅ Checkpoint 4
**Goal**: Add week parameters to all navigation

#### Tasks:
1. ✅ Add week parameter to edit page URLs
2. ✅ Update navigation from dashboard to edit with week
3. ✅ Update navigation from overview to edit with week
4. ✅ Update FAB (floating action button) links

#### Deliverables:
- [x] Week-aware navigation
- [x] Consistent URL parameters
- [x] Proper week context passing

### Phase 5: Week Navigation Implementation ✅ Checkpoint 5
**Goal**: Make week navigation functional

#### Tasks:
1. ✅ Update dashboard week navigation to load correct data
2. ✅ Update edit page to support week navigation
3. ✅ Add week indicator to edit page UI
4. ✅ Ensure week changes trigger data reload

#### Deliverables:
- [x] Functional week navigation
- [x] Visual week indicators
- [x] Proper data updates on week change

### Phase 6: Synchronization System ✅ Checkpoint 6
**Goal**: Unified synchronization across all screens

#### Tasks:
1. ✅ Create central event system for schedule updates
2. ✅ Update all screens to use consistent sync mechanism
3. ✅ Remove redundant sync methods
4. ✅ Test cross-screen synchronization

#### Deliverables:
- [x] Central sync event system
- [x] Consistent update propagation
- [x] Reliable cross-screen sync

### Phase 7: Edge Cases and Polish ✅ Checkpoint 7
**Goal**: Handle all edge cases and ensure smooth UX

#### Tasks:
1. ✅ Handle week boundaries (Sunday/Monday transition)
2. ✅ Handle timezone considerations
3. ✅ Add "Copy from previous week" functionality
4. ✅ Add loading states for week transitions
5. ✅ Ensure proper error handling

#### Deliverables:
- [x] Robust edge case handling
- [x] Copy week functionality
- [x] Smooth week transitions

### Phase 8: Testing and Validation ✅ Final Checkpoint
**Goal**: Ensure everything works correctly

#### Tasks:
1. ✅ Test multi-week navigation
2. ✅ Test synchronization between screens
3. ✅ Test data persistence across weeks
4. ✅ Test fallback to recurring schedules
5. ✅ Test edge cases

#### Success Criteria:
- [x] Different schedules can be saved for different weeks
- [x] All screens show consistent data for the selected week
- [x] Week navigation works smoothly
- [x] Existing recurring schedules still work
- [x] No data loss or corruption

## Implementation Details

### Key Code Changes

#### 1. Date Utilities (`lib/date-utils.ts`)
```typescript
export function getWeekBounds(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Sunday
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export function formatWeekKey(date: Date): string {
  const { start } = getWeekBounds(date);
  return start.toISOString().split('T')[0]; // YYYY-MM-DD of week start
}
```

#### 2. Data Loading Pattern
```typescript
// Load schedules for specific week with fallback
const { start, end } = getWeekBounds(selectedWeek);

// First try to load date-specific schedules
const dateSpecific = await supabase
  .from('schedules')
  .select('*')
  .gte('date', start.toISOString())
  .lte('date', end.toISOString());

// If no date-specific, load recurring
if (!dateSpecific || dateSpecific.length === 0) {
  const recurring = await supabase
    .from('schedules')
    .select('*')
    .is('date', null);
}
```

#### 3. Data Saving Pattern
```typescript
// Save with both day and date
const scheduleData = {
  user_id: userId,
  day: dayName,
  date: getDateForDayInWeek(selectedWeek, dayName),
  start_time: timeBlock.start,
  end_time: timeBlock.end,
  label: timeBlock.label,
  all_day: timeBlock.allDay
};
```

### UI Changes (Minimal)

1. **Dashboard**: Week navigation already exists, just needs to be functional
2. **Edit Page**: Add week indicator in header (e.g., "Editing week of Jan 5-11")
3. **Overview**: Add week context to existing day navigation
4. **All Screens**: Add subtle loading states during week transitions

### Synchronization Strategy

1. **Central Event Bus**: Create a unified event system
2. **Event Types**:
   - `scheduleUpdated`: When any schedule changes
   - `weekChanged`: When user navigates to different week
   - `syncRequired`: Force refresh all screens
3. **Smart Caching**: Cache week data to reduce API calls
4. **Optimistic Updates**: Update UI immediately, sync in background

## Risk Mitigation

1. **Data Migration**: Keep existing day-based system as fallback
2. **Performance**: Implement week-based caching
3. **Consistency**: Use transaction-like updates where possible
4. **User Experience**: Show clear loading states and error messages

## Success Metrics

1. Users can create different schedules for different weeks
2. All screens stay perfectly synchronized
3. Performance remains fast (< 500ms for week switches)
4. No breaking changes for existing users
5. Intuitive UI with minimal learning curve