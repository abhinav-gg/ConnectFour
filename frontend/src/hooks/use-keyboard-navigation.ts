"use client"

import { useEffect } from "react"

export function useKeyboardNavigation(onEscape?: () => void, onEnter?: () => void, isActive = true) {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          onEscape?.()
          break
        case "Enter":
          if (event.target === document.activeElement) {
            onEnter?.()
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onEscape, onEnter, isActive])
}
