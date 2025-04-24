import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roommate Scheduler',
  description: 'Schedule coordination app for roommates',
  generator: 'v0.dev',
  manifest: '/manifest.json',
  themeColor: '#282828',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Roommate Scheduler',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Roommate Scheduler" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        
        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/splash.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(min-device-width: 768px) and (max-device-width: 1024px)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(min-device-width: 834px) and (max-device-width: 834px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(min-device-width: 1024px) and (max-device-width: 1024px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
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
          `
        }} />
      </body>
    </html>
  )
}
