import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ClientOnlyScripts } from '@/components/client-only-scripts'
import { caveat } from './fonts'

export const metadata: Metadata = {
  title: 'Roomeez',
  description: 'Schedule coordination app for roommates',
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Roomeez',
    startupImage: [
      '/splash.png',
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#282828',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={caveat.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Roomeez" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Disable swipe to go back */}
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png?v=2" />
        <link rel="icon" href="/icons/icon-512x512.png?v=2" />
        
        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/splash.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(min-device-width: 768px) and (max-device-width: 1024px)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(min-device-width: 834px) and (max-device-width: 834px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash.png" media="(min-device-width: 1024px) and (max-device-width: 1024px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body className="overflow-y-auto">
        {children}
        <ClientOnlyScripts />
      </body>
    </html>
  )
}
