"use client"

import { motion } from "framer-motion"
import { SkipBack, ChevronLeft, ChevronRight, SkipForward } from "lucide-react"
import { useEffect } from "react"

interface GameControlsProps {
  onFirstMove?: () => void
  onPreviousMove?: () => void
  onNextMove?: () => void
  onLastMove?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
  totalMoveCount?: number
  currentMoveIndex?: number
}

export function GameControls({
  onFirstMove,
  onPreviousMove,
  onNextMove,
  onLastMove,
  canGoBack,
  canGoForward,
  totalMoveCount = 0,
  currentMoveIndex = 0,
}: GameControlsProps) {
  
  // Calculate canGoBack and canGoForward if not provided
  const actualCanGoBack = canGoBack ?? currentMoveIndex > 0
  const actualCanGoForward = canGoForward ?? currentMoveIndex < totalMoveCount

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return // Don't interfere with input fields
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          onLastMove?.()
          break
        case 'ArrowDown':
          event.preventDefault()
          onFirstMove?.()
          break
        case 'ArrowLeft':
          event.preventDefault()
          onPreviousMove?.()
          break
        case 'ArrowRight':
          event.preventDefault()
          onNextMove?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onFirstMove, onPreviousMove, onNextMove, onLastMove])

  const navigationButtons = [
    { icon: SkipBack, onClick: onFirstMove, disabled: !actualCanGoBack },
    { icon: ChevronLeft, onClick: onPreviousMove, disabled: !actualCanGoBack },
    { icon: ChevronRight, onClick: onNextMove, disabled: !actualCanGoForward },
    { icon: SkipForward, onClick: onLastMove, disabled: !actualCanGoForward },
  ]

  return (
    <div className="flex gap-2 justify-center">
      {navigationButtons.map((button, index) => (
        <motion.button
          key={index}
          onClick={button.onClick}
          disabled={button.disabled}
          className={`
          p-3 rounded-full transition-all duration-200
          ${
            button.disabled
              ? "bg-brand-primary/30 text-brand-text-muted cursor-not-allowed"
              : "bg-brand-primary/60 hover:bg-brand-primary/80 text-white"
          }
        `}
          whileHover={button.disabled ? {} : { scale: 1.05 }}
          whileTap={button.disabled ? {} : { scale: 0.95 }}
        >
          <button.icon className="w-6 h-6" />
        </motion.button>
      ))}
    </div>
  )
}
