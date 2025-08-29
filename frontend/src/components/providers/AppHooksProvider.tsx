"use client"

import { usePreventZoom } from '@/hooks/use-prevent-zoom'
import { ReactNode } from 'react'

interface AppHooksProviderProps {
  children: ReactNode
}

/**
 * Provider component that manages application-wide hooks
 * Add new global hooks here to keep them organized and maintainable
 */
export function AppHooksProvider({ children }: AppHooksProviderProps) {
  // Zoom prevention for mobile devices
  const appRef = usePreventZoom({
    preventDoubleTapZoom: true,
    preventPinchZoom: true,
    preventKeyboardZoom: false, // Keep for accessibility
    touchDevicesOnly: true,
  }) as React.RefObject<HTMLDivElement>

  // Add future global hooks here, for example:
  // const analyticsRef = useAnalytics()
  // const performanceRef = usePerformanceMonitoring()
  // const accessibilityRef = useAccessibilityEnhancements()

  return (
    <div ref={appRef} className="min-h-screen w-full">
      {children}
    </div>
  )
}
