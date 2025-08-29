"use client"

import { useEffect, useRef } from "react"

interface UsePreventZoomOptions {
  // Prevent double-tap zoom
  preventDoubleTapZoom?: boolean
  // Prevent pinch-to-zoom
  preventPinchZoom?: boolean
  // Prevent zoom via keyboard shortcuts (Ctrl/Cmd + +/-)
  preventKeyboardZoom?: boolean
  // Only apply on touch devices
  touchDevicesOnly?: boolean
}

export function usePreventZoom(options: UsePreventZoomOptions = {}) {
  const {
    preventDoubleTapZoom = true,
    preventPinchZoom = true,
    preventKeyboardZoom = false,
    touchDevicesOnly = true,
  } = options

  const containerRef = useRef<HTMLElement>(null)
  const lastTouchTime = useRef<number>(0)
  const touchCount = useRef<number>(0)

  useEffect(() => {
    // Check if we should only apply to touch devices
    if (touchDevicesOnly && !('ontouchstart' in window)) {
      return
    }

    const container = containerRef.current || document.documentElement

    // Prevent double-tap zoom
    const handleTouchEnd = (e: TouchEvent) => {
      if (!preventDoubleTapZoom) return

      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTouchTime.current

      // If time between taps is less than 300ms, prevent default
      if (tapLength < 300 && tapLength > 0) {
        e.preventDefault()
        e.stopPropagation()
      }

      lastTouchTime.current = currentTime
    }

    // Prevent pinch-to-zoom
    const handleTouchMove = (e: TouchEvent) => {
      if (!preventPinchZoom) return

      // If more than one finger is touching, prevent default
      if (e.touches.length > 1) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Prevent zoom via touch gestures
    const handleGestureStart = (e: Event) => {
      if (preventPinchZoom) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Prevent keyboard zoom shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!preventKeyboardZoom) return

      // Prevent Ctrl/Cmd + Plus/Minus/0 (zoom shortcuts)
      if ((e.ctrlKey || e.metaKey) && (
        e.key === '+' || 
        e.key === '-' || 
        e.key === '=' || 
        e.key === '0' ||
        e.keyCode === 187 || // Plus key
        e.keyCode === 189 || // Minus key
        e.keyCode === 48     // Zero key
      )) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Prevent wheel zoom (Ctrl + scroll)
    const handleWheel = (e: WheelEvent) => {
      if (!preventKeyboardZoom) return

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Add event listeners
    container.addEventListener('touchend', handleTouchEnd, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('gesturestart', handleGestureStart, { passive: false })
    
    if (preventKeyboardZoom) {
      document.addEventListener('keydown', handleKeyDown, { passive: false })
      container.addEventListener('wheel', handleWheel, { passive: false })
    }

    // Cleanup
    return () => {
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('gesturestart', handleGestureStart)
      
      if (preventKeyboardZoom) {
        document.removeEventListener('keydown', handleKeyDown)
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [preventDoubleTapZoom, preventPinchZoom, preventKeyboardZoom, touchDevicesOnly])

  return containerRef
}

// Utility hook for game-specific zoom prevention
export function useGameZoomPrevention() {
  const containerRef = usePreventZoom({
    preventDoubleTapZoom: true,
    preventPinchZoom: true,
    preventKeyboardZoom: false, // Allow keyboard zoom for accessibility
    touchDevicesOnly: true,
  })

  return containerRef
}
