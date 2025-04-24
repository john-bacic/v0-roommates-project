"use client"

import { useEffect } from 'react'

export function ClientOnlyScripts() {
  useEffect(() => {
    // Load the disable-swipe.js script dynamically only on the client side
    const script = document.createElement('script')
    script.src = '/disable-swipe.js'
    script.async = true
    document.body.appendChild(script)

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          function(err) {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }

    return () => {
      // Clean up the script when the component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return null
}
