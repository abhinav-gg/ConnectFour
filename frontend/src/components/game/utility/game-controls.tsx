"use client"

import { motion } from "framer-motion"
import { SkipBack, ChevronLeft, ChevronRight, SkipForward, Flag, Users } from "lucide-react"

interface GameControlsProps {
  onFirstMove?: () => void
  onPreviousMove?: () => void
  onNextMove?: () => void
  onLastMove?: () => void
  onResign?: () => void
  onOfferDraw?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
}

export function GameControls({
  onFirstMove,
  onPreviousMove,
  onNextMove,
  onLastMove,
  onResign,
  onOfferDraw,
  canGoBack = true,
  canGoForward = true,
}: GameControlsProps) {
  const navigationButtons = [
    { icon: SkipBack, onClick: onFirstMove, disabled: !canGoBack },
    { icon: ChevronLeft, onClick: onPreviousMove, disabled: !canGoBack },
    { icon: ChevronRight, onClick: onNextMove, disabled: !canGoForward },
    { icon: SkipForward, onClick: onLastMove, disabled: !canGoForward },
  ]

  const gameActions = [
    { icon: Flag, onClick: onResign, label: "Resign" },
    { icon: Users, onClick: onOfferDraw, label: "Offer Draw" },
  ]

  return (
    <div className="space-y-4">
      {/* Game Action Buttons */}
      <div className="flex gap-3 justify-center">
        {gameActions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.onClick}
            className="bg-brand-primary/60 hover:bg-brand-primary/80 text-white p-3 rounded-full transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={action.label}
          >
            <action.icon className="w-6 h-6" />
          </motion.button>
        ))}
      </div>

      {/* Navigation Controls */}
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
    </div>
  )
}
