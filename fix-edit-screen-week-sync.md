# Edit Screen Week Synchronization Fix

## Problem
The edit screen was not consistently loading the correct week's schedules, especially when polling for updates or responding to sync events.

## Root Cause
Several places in the edit screen code were calling `loadUserData(userName)` without passing the `selectedWeek` parameter, causing it to default to the current week instead of the selected week.

## Solution
Updated all calls to `loadUserData` to include the `selectedWeek` parameter to ensure the edit screen always loads and displays the correct week's schedules.

## Changes Made

### app/schedule/edit/page.tsx

1. **Polling mechanism** (line 206-211):
   - Changed from: `loadUserData(userName)`
   - Changed to: `loadUserData(userName, selectedWeek)`
   - Added `selectedWeek` to useEffect dependencies

2. **Initial load in second useEffect** (line 261):
   - Changed from: `loadUserData(userToLoad)`
   - Changed to: `loadUserData(userToLoad, weekDate)`
   - Added week parsing before the call

3. **Sync event handler** (line 319):
   - Changed from: `loadUserData(userName)`
   - Changed to: `loadUserData(userName, selectedWeek)`
   - Added `selectedWeek` to useEffect dependencies

## Result
- The edit screen now consistently shows the same schedules as the dashboard and overview for the selected week
- Week navigation properly updates the displayed schedules
- Polling and sync events respect the selected week
- No more confusion between current week and selected week schedules