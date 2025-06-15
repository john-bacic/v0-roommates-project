# Roomeez Logo Navigation Update

## Change Made
Added click functionality to the Roomeez logo in the Dashboard header to navigate back to the current week's dashboard.

## Implementation Details

### File: app/dashboard/page.tsx
Changed the logo container from a `<div>` to a `<button>` with an onClick handler that:
1. Sets the current week to today's date
2. Emits a week change event 
3. Reloads the data for the current week

### Code:
```typescript
<button
  onClick={() => {
    // Navigate to current week's dashboard
    const today = new Date()
    setCurrentWeek(today)
    emitWeekChange(today, 'dashboard')
    // Reload data for current week
    loadData()
  }}
  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
  title="Go to current week"
>
  <img src="/icons/small-icon.png?v=2" ... />
  <h1 className="text-2xl caveat-bold" ...>
    Roomeez
  </h1>
</button>
```

## User Experience
- Clicking the Roomeez logo will always bring users back to the current week's view
- Includes hover effect (opacity change) for visual feedback
- Tooltip shows "Go to current week" on hover

## Note
The Roomeez logo only appears on the Dashboard page. Other pages (Overview, Edit Schedule, Roommates) have different header structures and don't include the logo.