import { useState, useEffect } from 'react';

interface UpdateIndicatorProps {
  show: boolean;
  timestamp?: Date | null;
  message?: string;
  duration?: number;
}

export default function UpdateIndicator({ 
  show, 
  timestamp = null, 
  message = 'Updated', 
  duration = 3000 
}: UpdateIndicatorProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center animate-pulse">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>
        {message} {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
      </span>
    </div>
  );
}
