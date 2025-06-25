"use client"
import React, { useState, useEffect } from "react"

export default function NotchPaddingWrapper({ children }: { children: React.ReactNode }) {
  const [notchPadding, setNotchPadding] = useState<{ paddingTop?: string; paddingLeft?: string; paddingRight?: string }>({})

  useEffect(() => {
    function updateNotchPadding() {
      const isIPhone12 = /iPhone/.test(navigator.userAgent) && (window.screen.height === 844 || window.screen.width === 844)
      const isLandscape = window.innerWidth > window.innerHeight
      if (isIPhone12) {
        if (isLandscape) {
          setNotchPadding({ paddingLeft: 'env(safe-area-inset-left, 47px)', paddingRight: 'env(safe-area-inset-right, 47px)', paddingTop: '0px' })
        } else {
          setNotchPadding({ paddingTop: 'env(safe-area-inset-top, 47px)' })
        }
      } else {
        setNotchPadding({ paddingTop: 'env(safe-area-inset-top, 0px)' })
      }
    }
    updateNotchPadding()
    window.addEventListener('resize', updateNotchPadding)
    window.addEventListener('orientationchange', updateNotchPadding)
    return () => {
      window.removeEventListener('resize', updateNotchPadding)
      window.removeEventListener('orientationchange', updateNotchPadding)
    }
  }, [])

  return (
    <div style={notchPadding}>
      {children}
    </div>
  )
} 