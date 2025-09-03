"use client"

import { motion } from "framer-motion"
import { SkipBack, ChevronLeft, ChevronRight, SkipForward } from "lucide-react"
import { useEffect, useRef } from "react"

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

  // Refs for button animations
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const prevButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const lastButtonRef = useRef<HTMLButtonElement>(null)

  // Trigger button animation
  const animateButton = (buttonRef: React.RefObject<HTMLButtonElement>) => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'scale(0.95)'
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.style.transform = 'scale(1)'
        }
      }, 100)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return // Don't interfere with input fields
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          animateButton(lastButtonRef)
          onLastMove?.()
          break
        case 'ArrowDown':
          event.preventDefault()
          animateButton(firstButtonRef)
          onFirstMove?.()
          break
        case 'ArrowLeft':
          event.preventDefault()
          animateButton(prevButtonRef)
          onPreviousMove?.()
          break
        case 'ArrowRight':
          event.preventDefault()
          animateButton(nextButtonRef)
          onNextMove?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onFirstMove, onPreviousMove, onNextMove, onLastMove])

  const navigationButtons = [
    { icon: SkipBack, onClick: onFirstMove, disabled: !actualCanGoBack, ref: firstButtonRef },
    { icon: ChevronLeft, onClick: onPreviousMove, disabled: !actualCanGoBack, ref: prevButtonRef },
    { icon: ChevronRight, onClick: onNextMove, disabled: !actualCanGoForward, ref: nextButtonRef },
    { icon: SkipForward, onClick: onLastMove, disabled: !actualCanGoForward, ref: lastButtonRef },
  ]

  return (
    <div className="flex gap-4 justify-center">
      {navigationButtons.map((button, index) => (
        <motion.button
          key={index}
          ref={button.ref}
          onClick={button.onClick}
          disabled={button.disabled}
          className={`
          p-2 rounded-full transition-all duration-200
          ${
            button.disabled
              ? "bg-brand-primary/30 text-brand-text-muted cursor-not-allowed"
              : "bg-brand-primary/60 hover:bg-brand-primary/80 text-white"
          }
        `}
          whileHover={button.disabled ? {} : { scale: 1.05 }}
          whileTap={button.disabled ? {} : { scale: 0.95 }}
        >
          <button.icon className="w-5 h-5" />
        </motion.button>
      ))}
    </div>
  )
}
