"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Edit2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"
import { WeeklySchedule } from "@/components/weekly-schedule"
import Link from "next/link"
import Image from "next/image"
import { getSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { caveat } from "../fonts"
import { ErrorBoundaryHandler } from "@/components/error-boundary"
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns'

// Define interfaces
interface User {
  id: number;
  name: string;
  color: string;
  initial: string;
}

interface TimeBlock {
  id?: string;
  start: string;
  end: string;
  label: string;
  allDay?: boolean;
}

// Define Supabase response types
interface ScheduleRecord {
  id: string;
  user_id: number;
  day: string;
  start_time: string;
  end_time: string;
  label: string;
  all_day: boolean;
  created_at?: string;
}

// Type for Supabase response
type SupabaseData = Record<string, any>[]

// Define the days of the week as a type and constant array
type DayName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
const DAYS_OF_WEEK: DayName[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Define schedule types to match Supabase schema
type UserSchedule = Record<string, TimeBlock[]>;
type SchedulesType = Record<number, UserSchedule>;

// Initial users array
const initialUsers: User[] = [
  { id: 1, name: "Riko", color: "#FF7DB1", initial: "R" },
  { id: 2, name: "Narumi", color: "#63D7C6", initial: "N" },
  { id: 3, name: "John", color: "#F8D667", initial: "J" },
]

// Type guard function to check if an object is a valid user
function isValidUser(obj: unknown): obj is User {
  return obj !== null && 
         typeof obj === 'object' && 
         'id' in obj && 
         'name' in obj && 
         'color' in obj && 
         'initial' in obj;
}

// Function to get the current day (considers times before 6am as previous day)
function getCurrentDay() {
  // Return a default day during server-side rendering to prevent hydration mismatch
  if (typeof window === 'undefined') {
    return "Monday"; // Default static day for SSR
  }
  
  const now = new Date();
  const hours = now.getHours();
  
  // If it's before 6am, consider it the previous day
  let adjustedDate = new Date(now);
  if (hours < 6) {
    adjustedDate.setDate(now.getDate() - 1);
  }
  
  const dayIndex = adjustedDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Convert to our day format (we use full day names)
  const dayMap = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ] as const;
  
  return dayMap[dayIndex];
}

// Import the shared GitCommitHash component
import GitCommitHash from "@/components/git-commit-hash";

export default function Dashboard() {
  // Use a state to track if we're on the client side
  const [isClient, setIsClient] = useState(false)
  
  // Always initialize currentWeek to today's date
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [userName, setUserName] = useState("")
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [userColor, setUserColor] = useState("#B388F5") // Default color
  const { toast } = useToast()
  
  // Initialize with a default value to avoid hydration mismatch
  const [use24HourFormat, setUse24HourFormat] = useState(false)
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update client-side state after hydration
  useEffect(() => {
    console.log('💻 Client hydration useEffect triggered');
    setIsClient(true)
    console.log('✅ Set isClient to true');
    
    // Debug environment variables on client side
    console.log('🔍 Environment variables check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    
    // Now that we're on the client side, we can safely access localStorage
    const savedFormat = localStorage.getItem('use24HourFormat')
    if (savedFormat !== null) {
      setUse24HourFormat(savedFormat === 'true')
    }
    
    // Get the user name from localStorage immediately after hydration
    const storedName = localStorage.getItem("userName")
    console.log('Initial hydration - username from localStorage:', storedName)
    if (storedName) {
      setUserName(storedName)
    }
  }, [])
  
  // Initialize week date - only run once after hydration
  const weekInitialized = useRef(false);
  
  useEffect(() => {
    // Skip during SSR and if already initialized
    if (!isClient || weekInitialized.current) return;
    
    // Mark as initialized to prevent duplicate execution
    weekInitialized.current = true;
    
    // Check for week parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const weekParam = urlParams.get('week')
    
    if (weekParam) {
      try {
        const weekFromUrl = new Date(weekParam)
        if (!isNaN(weekFromUrl.getTime())) {
          console.log('Setting currentWeek from URL parameter:', weekFromUrl.toISOString())
          setCurrentWeek(weekFromUrl)
          return
        }
      } catch (error) {
        console.error('Invalid week parameter in URL:', weekParam)
      }
    }
    
    // Default to today's date if no valid week parameter
    const today = new Date()
    console.log('Setting currentWeek to today:', today.toISOString())
    setCurrentWeek(today)
  }, [isClient])
  

  
  // Check for refresh flags and refresh the dashboard when needed
  useEffect(() => {
    if (!isClient) return; // Skip during SSR
    
    console.log('Dashboard mounted, checking for refresh flags');
    
    // Check for all possible refresh flags
    const shouldRefreshFromRoommates = sessionStorage.getItem('refreshDashboard') === 'true';
    const shouldRefreshFromEdit = sessionStorage.getItem('refreshAfterNavigation') === 'true';
    const dashboardNeedsRefresh = sessionStorage.getItem('dashboardNeedsRefresh') === 'true';
    
    // Check URL parameters for refresh request
    const urlParams = new URLSearchParams(window.location.search);
    const hasRefreshParam = urlParams.has('refresh');
    
    if (shouldRefreshFromRoommates || shouldRefreshFromEdit || dashboardNeedsRefresh || hasRefreshParam) {
      // Clear all refresh flags
      sessionStorage.removeItem('refreshDashboard');
      sessionStorage.removeItem('refreshAfterNavigation');
      sessionStorage.removeItem('dashboardNeedsRefresh');
      
      // Remove refresh parameter from URL without refreshing
      if (hasRefreshParam && window.history.replaceState) {
        const newUrl = window.location.pathname + 
                      (window.location.search ? 
                        window.location.search.replace(/[?&]refresh=[^&]*/, '') : '');
        window.history.replaceState({}, document.title, newUrl);
      }
      
      // Force a refresh of the page data
      console.log('Dashboard refreshing data after navigation');
      loadData();
    }
    
    // Also listen for the refreshTimeDisplays event from the edit page
    const handleRefreshEvent = () => {
      console.log('Received refreshTimeDisplays event');
      loadData();
    };
    
    document.addEventListener('refreshTimeDisplays', handleRefreshEvent);
    
    return () => {
      document.removeEventListener('refreshTimeDisplays', handleRefreshEvent);
    };
  }, [isClient]);
  
  // Add another effect to handle focus/visibility changes
  useEffect(() => {
    if (!isClient) return; // Skip during SSR
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const refreshTimestamp = sessionStorage.getItem('refreshTimestamp');
        if (refreshTimestamp) {
          // Only refresh if we haven't refreshed for this timestamp yet
          const lastProcessedTimestamp = sessionStorage.getItem('lastProcessedTimestamp');
          if (refreshTimestamp !== lastProcessedTimestamp) {
            console.log('Refreshing dashboard on visibility change');
            sessionStorage.setItem('lastProcessedTimestamp', refreshTimestamp);
            loadData();
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient]);
  
  // Apply the time format class to the document - only run on client side
  useEffect(() => {
    // Skip this effect during server-side rendering
    if (!isClient) return;
    
    // Update document class
    if (use24HourFormat) {
      document.documentElement.classList.add('use-24h-time')
    } else {
      document.documentElement.classList.remove('use-24h-time')
    }
    
    // Save to localStorage
    localStorage.setItem('use24HourFormat', use24HourFormat.toString())
    
    // Dispatch event to notify all components
    const event = new CustomEvent('timeFormatChange', {
      detail: { use24Hour: use24HourFormat }
    })
    window.dispatchEvent(event)
    
    // Force refresh of time inputs to apply the new format
    const timeInputs = document.querySelectorAll('input[type="time"]')
    timeInputs.forEach(input => {
      const htmlInput = input as HTMLInputElement
      const currentValue = htmlInput.value
      // Update the data-time-format attribute
      htmlInput.setAttribute('data-time-format', use24HourFormat ? '24h' : '12h')
      // Force a refresh by temporarily changing the value
      const tempValue = currentValue === '00:00' ? '00:01' : '00:00'
      htmlInput.value = tempValue
      htmlInput.value = currentValue
    })
  }, [use24HourFormat])

  // State for schedules
  const [schedules, setSchedules] = useState<Record<string, Record<string, TimeBlock[]>>>({});
  
  // Debug state to track schedule loading
  const [scheduleLoadAttempts, setScheduleLoadAttempts] = useState(0);

  // Function to load data from Supabase - defined with useCallback to avoid recreation
  const loadData = useCallback(async (weekDate?: Date) => {
    try {
      console.log('🔄 Starting loadData function...');
      setLoading(true);
      setError(null);
      setScheduleLoadAttempts(prev => prev + 1);

      // Use provided week date or current week from state
      const targetDate = weekDate || currentWeek;
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 }); // 0 = Sunday
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 0 });
      
      // Store the week start and end for filtering schedules later
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      console.log('Loading data for week:', weekStart.toDateString(), 'to', weekEnd.toDateString());
      console.log('Week date range for filtering:', weekStartStr, 'to', weekEndStr);

      // Get all users
      const { data: usersData, error: usersError } = await getSupabase()
        .from('users')
        .select('*');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setError('Failed to load users');
        setLoading(false);
        return;
      }

      // Check if we have users
      if (!usersData || usersData.length === 0) {
        console.log('No users found');
        setError('No users found');
        setLoading(false);
        return;
      }

      console.log('Loaded users:', usersData);

      // Set users state
      setUsers(usersData.map((user: any) => ({
        id: user.id,
        name: user.name,
        color: user.color || '#CCCCCC'
      })));

      // Initialize schedules object
      const schedulesData: Record<string, Record<string, TimeBlock[]>> = {};

      console.log('👥 Processing schedules for', usersData.length, 'users');

      // Process each user's schedule
      for (const user of usersData) {
        const userId = user.id;
        console.log(`📅 Processing schedule for user: ${user.name} (ID: ${userId})`);

        // Initialize formatted schedules for this user with all days of the week
        const formattedSchedules: Record<string, TimeBlock[]> = {
          'Sunday': [],
          'Monday': [],
          'Tuesday': [],
          'Wednesday': [],
          'Thursday': [],
          'Friday': [],
          'Saturday': []
        }

        // Get schedules from Supabase with aggressive type assertion to fix TypeScript error
        // @ts-ignore - Bypass TypeScript check for Supabase response
        // Get schedules for this user for the specific week
        // Filter by date range using the date column in the database
        const response = await getSupabase()
          .from('schedules')
          .select('*')
          // @ts-ignore: Supabase type inference issue
          .eq('user_id', user.id)
          // Filter by date range for the current week
          .gte('date', weekStartStr)
          .lte('date', weekEndStr)

        // Extract data and error from response
        const data = response.data
        const schedulesError = response.error

        // Ensure data is an array
        const userSchedules = Array.isArray(data) ? data : []

        // Debug logging for schedules
        console.log(`=== SCHEDULES FOR USER ${user.name} ===`);
        console.log('Query date range:', weekStart.toISOString().split('T')[0], 'to', weekEnd.toISOString().split('T')[0]);
        console.log('Raw schedules from DB:', userSchedules);
        console.log('Raw schedules count:', userSchedules.length);
        console.log('=====================================');

        // Map the data to ensure it has the correct structure
        const typedSchedules = userSchedules.map((schedule: any) => {
          console.log('Processing schedule:', schedule);
          return {
            id: String(schedule?.id || ''),
            user_id: typeof schedule?.user_id === 'number' ? schedule.user_id : parseInt(String(schedule?.user_id || '0')),
            day: String(schedule?.day || ''),
            start_time: String(schedule?.start_time || ''),
            end_time: String(schedule?.end_time || ''),
            label: String(schedule?.label || ''),
            all_day: Boolean(schedule?.all_day),
            created_at: String(schedule?.created_at || '')
          };
        })

        console.log('Typed schedules:', typedSchedules);

        // Generate a unique key for this specific week
        // This will be used to store and retrieve week-specific schedules
        const weekKey = weekStart.toISOString().split('T')[0];
        console.log('Current week key:', weekKey);
        
        // Since we don't have a date field in the database to filter by,
        // we'll use localStorage to store week-specific schedules
        // Each week will have its own schedules stored separately
        
        // Check if we have already loaded schedules for this specific week
        let weekSpecificSchedules = null;
        if (isClient) {
          try {
            const savedSchedules = localStorage.getItem(`week_schedules_${weekKey}`);
            if (savedSchedules) {
              weekSpecificSchedules = JSON.parse(savedSchedules);
              console.log(`Found existing schedules for week ${weekKey}:`, weekSpecificSchedules);
            }
          } catch (e) {
            console.error('Error checking for week-specific schedules:', e);
          }
        }
        
        // Always process schedules, even if empty (to ensure proper initialization)
        // Transform the data into the format expected by the app
        typedSchedules.forEach(schedule => {
          // Get day from schedule, with fallbacks to ensure we have a valid day
          let day = String(schedule.day || '')

          // If day is empty or invalid, try to determine it from the date field
          if (!day || !['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(day)) {
            console.log('Invalid day value:', day, 'for schedule:', schedule);

            // Try to get day from date field if available
            // Access the date as a property from the original schedule object (not the typed one)
            const scheduleDate = userSchedules.find(s => s.id === schedule.id)?.date;

            if (scheduleDate) {
              try {
                const dateObj = new Date(scheduleDate);
                const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
                day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
                console.log('Determined day from date:', day);
              } catch (e) {
                console.error('Error parsing date:', e);
                day = 'Monday'; // Default to Monday if all else fails
              }
            } else {
              day = 'Monday'; // Default to Monday if no date field
              console.log('No date field, defaulting to Monday');
            }
          }

          // Ensure the day exists in our formatted schedules
          if (!formattedSchedules[day]) {
            formattedSchedules[day] = []
          }

          formattedSchedules[day].push({
            id: String(schedule.id || ''),
            start: String(schedule.start_time || ''),
            end: String(schedule.end_time || ''),
            label: String(schedule.label || ''),
            allDay: Boolean(schedule.all_day)
          })
        })

        // Always set the user's schedule data, even if empty
        console.log('Final formatted schedules for user:', formattedSchedules);
        console.log(`📊 Schedule count for ${user.name}: ${Object.values(formattedSchedules).flat().length} items`);
        schedulesData[userId] = formattedSchedules;
      }

      // Set schedules state
      console.log('🔄 Setting schedules state with:', schedulesData);
      console.log('📊 Total schedule items:',
        Object.values(schedulesData)
          .map(userSchedule => Object.values(userSchedule).flat().length)
          .reduce((a, b) => a + b, 0)
      );
      setSchedules(schedulesData);

      // Save schedules to localStorage as a backup with week information
      if (isClient) {
        try {
          // Create a week key in ISO format for storage
          const weekKey = weekStart.toISOString().split('T')[0];
          
          // Store schedules with the week key to ensure week-specific data
          localStorage.setItem(`week_schedules_${weekKey}`, JSON.stringify(schedulesData));
          console.log(`💾 Saved schedules for week ${weekKey} to localStorage`);
        } catch (e) {
          console.error('Error saving schedules to localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentWeek, toast]);

  // Effect to load data when component mounts - only run once
  const initialLoadComplete = useRef(false);
  
  useEffect(() => {
    // Skip during SSR and if already loaded
    if (!isClient || initialLoadComplete.current) return;
    
    // Mark as loaded to prevent duplicate execution
    initialLoadComplete.current = true;
    
    // Try to load schedules from localStorage for the current week
    try {
      // Create a week key in ISO format for storage
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const savedSchedules = localStorage.getItem(`week_schedules_${weekKey}`);
      if (savedSchedules) {
        const parsedSchedules = JSON.parse(savedSchedules);
        console.log(`📂 Loaded schedules for week ${weekKey} from localStorage:`, parsedSchedules);
        setSchedules(parsedSchedules);
      }
    } catch (e) {
      console.error('Error loading schedules from localStorage:', e);
    }
    
    // Initial data load
    console.log('🚀 Initial data load from mount effect');
    loadData(currentWeek);
  }, [isClient, loadData, currentWeek]); // Include loadData since it's now a useCallback
  
  // Effect to reload data whenever the current week changes
  useEffect(() => {
    // Skip during SSR or initial load
    if (!isClient || !initialLoadComplete.current) return;
    
    console.log('🔄 Reloading data due to week change:', currentWeek.toDateString());
    
    // Always clear schedules first to prevent showing stale data
    setSchedules({});
    
    // Load fresh data from the database immediately
    // This ensures we don't show schedules from the wrong week
    loadData(currentWeek);
    
    // We'll skip loading from localStorage as it might contain stale data
    // The loadData function will save the fresh data to localStorage after fetching
  
  }, [currentWeek, loadData, isClient]);

  // Set up real-time subscriptions to schedule and user changes - CLIENT SIDE ONLY
  useEffect(() => {
    // Skip entirely during server-side rendering or initial hydration
    if (!isClient) return undefined;
    
    // Additional hydration safety - wait for complete document load
    if (typeof document !== 'undefined' && document.readyState !== 'complete') {
      console.log('Dashboard: Waiting for complete hydration before setting up WebSockets');
      
      // Set up a one-time event listener for when the document is fully loaded
      const handleLoad = () => {
        console.log('Dashboard: Document fully loaded, now safe to set up WebSockets');
        // Don't call setIsClient here - it causes an infinite loop
      };
      
      // Only add the listener if we're still not fully loaded
      if (document.readyState === 'loading' || document.readyState === 'interactive') {
        window.addEventListener('load', handleLoad, { once: true });
        return () => window.removeEventListener('load', handleLoad);
      }
    }
    
    // Local variables to track subscription objects
    let scheduleSubscription: any = null;
    let userSubscription: any = null;
    
    console.log('Dashboard: Using page visibility for data refreshing');
    
    // No polling - we'll rely on the visibility change event instead
    try {
      // Don't call loadData here - it's already called in the mount effect
      
      // The visibility change handler is already set up in another useEffect
      console.log('Using page visibility changes for data refreshing');
    } catch (error) {
      console.error('Error with initial data load:', error);
      toast({
        title: "Data loading issue",
        description: "There was a problem loading your schedule data.",
        action: <ToastAction altText="Refresh">Refresh</ToastAction>,
        duration: 5000,
      });
    }

    // Clean up function - nothing to clean up since we're using visibility changes
    return () => {
      // No polling interval to clear
      console.log('Component unmounting - no intervals to clear');
    };
  }, [isClient, toast]); // Remove userName from dependencies

  // Load user data after component mounts (client-side only)
  useEffect(() => {
    console.log('🔧 User data useEffect triggered - isClient:', isClient);
    
    if (isClient) {
      // Get the user's name from localStorage (we'll keep this for user preference)
      const storedName = localStorage.getItem("userName")
      console.log('Retrieved username from localStorage:', storedName)
      
      // Always set the username, even if it's empty
      setUserName(storedName || '')
      
      // Only check for user color if we have a username
      if (storedName) {
        // Immediately check for the user's color in Supabase
        const fetchUserColor = async () => {
          try {
            // Fetch both name and color from the database
            const { data, error } = await getSupabase()
              .from('users')
              .select('name, color')
              .eq('name', storedName) // Use storedName directly since it's guaranteed to exist here
              .single()
            
            if (!error && data && typeof data === 'object') {
              // Update color if available
              if ('color' in data) {
                setUserColor(String(data.color))
              }
              
              // Update name from database if available - this ensures we're using the database name
              if ('name' in data && data.name) {
                setUserName(String(data.name))
                console.log('Updated username from database:', data.name)
              }
            }
          } catch (error) {
            console.error('Error fetching user color:', error)
          }
        }
        
        // Call the function to fetch user color
        fetchUserColor()
      }
    }
    
    // No initial data load here - moved to the mount effect
    
    // Return cleanup function
    return () => {
      // Any cleanup if needed
    }
  }, [isClient]) // Add isClient as dependency
  
  // Only set up event listeners on the client side in a separate useEffect
  useEffect(() => {
    if (isClient) {
      // Get stored name for event handlers
      const storedName = localStorage.getItem("userName")
      
      // Add event listener for color changes
      const handleColorChange = (event: StorageEvent) => {
        if (storedName && event.key?.startsWith("userColor_")) {
          const userName = event.key.replace("userColor_", "")
          if (userName === storedName && event.newValue) {
            setUserColor(event.newValue)
          }
        }
      }

      // Add event listener for custom color change events
      const handleCustomColorChange = (event: CustomEvent) => {
        if (storedName && event.detail.userName === storedName) {
          setUserColor(event.detail.color)
        }
      }

      // Listen for storage events (when localStorage changes)
      window.addEventListener("storage", handleColorChange)

      // Listen for our custom event
      window.addEventListener("userColorChange", handleCustomColorChange as EventListener)

      return () => {
        window.removeEventListener("storage", handleColorChange)
        window.removeEventListener("userColorChange", handleCustomColorChange as EventListener)
      }
    }
    
    // Return empty cleanup function for server-side rendering
    return () => {}
  }, [isClient]) // Add isClient as dependency

  // Reload data whenever the current week changes
  const previousWeekRef = useRef<Date | null>(null);
  
  useEffect(() => {
    // Skip during SSR or initial load (handled by initialLoadComplete)
    if (!isClient || !initialLoadComplete.current) return;
    
    // Get normalized week starts for comparison
    const prevWeekStart = previousWeekRef.current ? 
      startOfWeek(previousWeekRef.current, { weekStartsOn: 0 }).getTime() : null;
    const currentWeekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }).getTime();
    
    // Only reload if week has actually changed and we have a previous week
    if (prevWeekStart !== null && prevWeekStart !== currentWeekStart) {
      console.log('Week changed, reloading data for week:', currentWeek);
      loadData(currentWeek);
    }
    
    // Update ref for next comparison
    previousWeekRef.current = currentWeek;
  }, [currentWeek, isClient, loadData])

  // Format week range using a static string for server-side rendering or dynamic date for client-side
  const formatWeekRange = (date: Date) => {
    // During server-side rendering, return a generic string
    if (!isClient) {
      return "Week Schedule" // Generic label for server-side rendering
    }
    
    // Only do date calculations on the client side
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
    start.setHours(0, 0, 0, 0) // Reset time to midnight for accurate comparison

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // End of week (Saturday)

    // Format with month name
    const formatDate = (d: Date) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${monthNames[d.getMonth()]} ${d.getDate()}`
    }

    // Check if this is the current week
    const today = new Date()
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - today.getDay())
    currentWeekStart.setHours(0, 0, 0, 0) // Reset time to midnight for accurate comparison
    
    const isCurrentWeek = start.getTime() === currentWeekStart.getTime()
    
    if (isCurrentWeek) {
      return `Current Week (${formatDate(start)} - ${formatDate(end)})`
    } else {
      return `${formatDate(start)} - ${formatDate(end)}`
    }
  }

  const previousWeek = () => {
    const prevWeek = new Date(currentWeek)
    prevWeek.setDate(currentWeek.getDate() - 7)
    
    // Clear local schedules state immediately
    setSchedules({})
    setLoading(true)
    
    // Update the week - this will trigger the useEffect that loads data
    setCurrentWeek(prevWeek)
  }

  const nextWeek = () => {
    const nextWeek = new Date(currentWeek)
    nextWeek.setDate(currentWeek.getDate() + 7)
    
    // Clear local schedules state immediately
    setSchedules({})
    setLoading(true)
    
    // Update the week - this will trigger the useEffect that loads data
    setCurrentWeek(nextWeek)
  }

  const goToToday = () => {
    const today = new Date()
    console.log('Going to today:', today.toISOString())
    
    // Clear schedules first
    setSchedules({})
    setLoading(true)
    
    // Set current week to today
    setCurrentWeek(today)
    // Clear schedules to force reload
    setSchedules({})
  }


  // Function to clear schedules for the new week
  const clearSchedulesForNewWeek = async (showToast = true) => {
    try {
      // Create a copy of the current schedules
      const updatedSchedules = { ...schedules } as SchedulesType
      
      // Clear schedules for each user
      for (const userId in updatedSchedules) {
        if (updatedSchedules.hasOwnProperty(userId)) {
          const userIdNum = parseInt(userId)
          
          // Clear schedules for each day
          DAYS_OF_WEEK.forEach((day: DayName) => {
            if (updatedSchedules[userIdNum] && updatedSchedules[userIdNum][day]) {
              updatedSchedules[userIdNum][day] = []
            }
          })
          
          // Update in Supabase - only clear schedules for the current week
          if (userName === users.find(u => u.id === userIdNum)?.name) {
            // Calculate the current week's date range for deletion
            const weekStart = new Date(currentWeek)
            weekStart.setDate(currentWeek.getDate() - currentWeek.getDay()) // Start of week (Sunday)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
            
            // Only clear schedules in Supabase for the current user and current week
            const { error } = await getSupabase()
              .from('schedules')
              .delete()
              .eq('user_id', userIdNum)
              .gte('date', weekStart.toISOString().split('T')[0])
              .lte('date', weekEnd.toISOString().split('T')[0])
            
            if (error) {
              console.error('Error clearing schedules in Supabase:', error)
            }
          }
        }
      }
      
      // Update local state
      setSchedules(updatedSchedules)
      
      // Save to localStorage as a fallback
      localStorage.setItem('roommate-schedules', JSON.stringify(updatedSchedules))
      
      // Show toast if requested
      if (showToast) {
        toast({
          title: "Schedule cleared",
          description: "Your schedule for this week has been cleared.",
          variant: "default",
          duration: 3000,
        })
      }
      
    } catch (error) {
      console.error('Error clearing schedules for new week:', error)
      
      // Show error toast
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't clear your schedule. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }
  
  // Function to handle color updates from the WeeklySchedule component
  const handleColorUpdate = async (name: string, color: string) => {
    console.log(`Updating color for ${name} to ${color}`);
    
    // Find the user before updating state to ensure we have the correct ID
    const userToUpdate = users.find(user => user.name === name);
    if (!userToUpdate) {
      console.error(`User ${name} not found`);
      toast({
        title: "Error updating color",
        description: `Could not find user ${name}`,
        variant: "destructive",
      });
      return;
    }
    
    const userId = userToUpdate.id;
    const originalColor = userToUpdate.color;
    
    // Update the users array in state first for immediate UI feedback
    setUsers(prevUsers => {
      return prevUsers.map(user => 
        user.name === name ? { ...user, color } : user
      );
    });
    
    // Always update userColor if it's the current user
    if (name === userName) {
      setUserColor(color);
      
      // Client-side only code - only run if we're on the client
      if (isClient) {
        // Also update localStorage for backup
        localStorage.setItem(`userColor_${name}`, color);
        
        // Dispatch a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("userColorChange", {
            detail: { userName: name, color },
          })
        );
      }
    }
    
    // Update color in Supabase - using a completely direct approach
    try {
      console.log(`Updating Supabase for user ID ${userId} with color ${color}`);
      
      // Direct approach - no variables or complex objects, just inline values
      // This avoids any potential transformation issues
      const supabase = getSupabase();
      
      // First check the structure of the user in the database
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('Current user data in Supabase:', userData);
      
      if (fetchError) {
        console.error('Error fetching user data:', fetchError);
        throw new Error('Failed to fetch user data before update');
      }
      
      // Special handling for John's color update to ensure the data format is correct
      let data, error;
      
      // Debug log to see exactly what's being sent to Supabase
      console.log(`Updating user in Supabase:`);
      console.log(` - User ID: ${userId}`);
      console.log(` - Name: ${name}`);
      console.log(` - Color: ${color}`);
      
      if (name === "John") {
        console.log('Using special handling for John to ensure correct data format');
        
        // Create a properly typed update object for John's color
        // This avoids any potential type coercion or object structure issues
        const updateData: Record<string, string> = {
          color: color
        };
        
        console.log('Update data for John:', JSON.stringify(updateData));
        
        const result = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select();
        
        data = result.data;
        error = result.error;
      } else {
        // Normal approach for other users
        const result = await supabase
          .from('users')
          .update({
            color: color  // Direct value, no variables
          })
          .eq('id', userId)
          .select();
        
        data = result.data;
        error = result.error;
      }
      
      console.log('Supabase update response:', data, error);
      
      if (error) {
        console.error('Error updating user color in Supabase:', error);
        // Revert the color change if Supabase update fails
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.name === name ? { ...user, color: originalColor } : user
          )
        );
        if (name === userName) {
          setUserColor(originalColor);
        }
        toast({
          title: "Error updating color",
          description: "Failed to save color to the server. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log(`Successfully updated color for ${name} to ${color}`);
        toast({
          title: "Color updated",
          description: `Updated ${name}'s color to ${color}`,
        });
      }
    } catch (error) {
      console.error('Error updating user color:', error);
      // Revert the color change on error
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.name === name ? { ...user, color: originalColor } : user
        )
      );
      if (name === userName) {
        setUserColor(originalColor);
      }
      toast({
        title: "Error updating color",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  // Always return dark text for colored backgrounds
  const getTextColor = (bgColor: string) => {
    return "#000" // Always use dark text against colored backgrounds
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#282828] text-white">
      {/* Main header - fixed at the top */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#242424] shadow-md border-b border-[#333333]" data-component-name="Dashboard">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-[57px] px-4 w-full">
          {/* Update the header title with home icon */}
          <div className="flex items-center gap-2">
            <img 
              src="/icons/small-icon.png?v=2"
              alt="Roomeez Icon" 
              width="18" 
              height="18" 
              className="w-[18px] h-[18px]"
              data-component-name="Dashboard"
            />
            <h1 
              className="text-2xl caveat-bold cursor-pointer" 
              style={{ fontFamily: 'var(--font-caveat), cursive' }}
              data-component-name="Dashboard"
              onClick={goToToday}
              title="Go to current week"
            >
              Roomeez
            </h1>
          </div>

          {/* Add a link to the overview page in the header section */}
          <div className="flex items-center gap-2">
            {/* Show greeting with user name from database */}
            <span className="text-sm text-[#A0A0A0] mr-2" data-component-name="Dashboard">
              {isClient ? `Hi, ${userName || "Friend"}` : "Hi, Friend"}
            </span>

            <div id="weekly-schedule-controls" className="hidden md:flex items-center mr-4">
              {/* This div will be used by the WeeklySchedule component */}
            </div>
            <Link href="/roommates">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Users className="h-4 w-4" />
                <span className="sr-only">Roommates</span>
              </Button>
            </Link>
            <Link href="/overview">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="15" y1="3" x2="15" y2="21"></line>
                  <line x1="3" y1="3" x2="3" y2="21"></line>
                </svg>
                <span className="sr-only">Overview</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      {/* Spacer to account for fixed header */}
      <div className="h-[57px]"></div>
      <main className="flex-1 px-4 pb-20 pt-10 max-w-7xl mx-auto w-full relative" data-component-name="Dashboard">
        {/* Schedule content */}
        <div className="flex flex-col">
          {/* During server-side rendering, always show the loading state */}
          {!isClient || loading ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-[#A0A0A0]">Loading schedules...</p>
            </div>
          ) : (
            <ErrorBoundaryHandler
              fallback={
                <div className="p-4 bg-[#333333] rounded-md my-4">
                  <h3 className="text-red-400 font-bold mb-2">Schedule Error</h3>
                  <p className="text-sm text-[#A0A0A0] mb-2">
                    There was an error loading the schedule. Please try refreshing the page.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-3 py-1 text-xs bg-[#444444] hover:bg-[#555555] rounded"
                  >
                    Refresh Page
                  </button>
                </div>
              }
            >
              <WeeklySchedule 
                users={users}
                currentWeek={currentWeek}
                onColorChange={handleColorUpdate}
                schedules={schedules}
                useAlternatingBg={false}
                onTimeFormatChange={setUse24HourFormat}
                key={`schedule-${scheduleLoadAttempts}`} // Force re-render when schedules load
                onWeekChange={setCurrentWeek}
                onGoToToday={goToToday}
              />
            </ErrorBoundaryHandler>
          )}
          
          {/* Git commit hash display */}
          <footer className="text-center text-sm text-gray-400 mt-8 pb-4" data-component-name="Footer">
            {/* Only render GitCommitHash on client side to prevent hydration mismatch */}
            {isClient ? <GitCommitHash /> : <span className="text-[10px] text-[#666666] whitespace-nowrap">build: dev</span>}
          </footer>
        </div>
      </main>

      {/* Floating action button - only visible when logged in and on client side */}
      {isClient && userName && (
        <div 
          className="fixed bottom-6 right-6 z-[9999] transition-all duration-200 ease-in-out overflow-visible"
          data-component-name="LinkComponent"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
          }}
        >
          <Button
            asChild
            className="rounded-full min-h-[3.5rem] min-w-[3.5rem] p-3 border-2"
            style={{
              backgroundColor: userColor,
              color: getTextColor(userColor),
              borderColor: "rgba(0, 0, 0, 0.75)"
            }}
          >
            <Link 
              href={`/schedule/edit?from=%2Fdashboard&week=${currentWeek.toISOString()}&day=${encodeURIComponent(getCurrentDay())}&user=${encodeURIComponent(userName)}`} 
              data-component-name="LinkComponent"
            >
              <Edit2 className="h-6 w-6" />
              <span className="sr-only">Edit schedule</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}