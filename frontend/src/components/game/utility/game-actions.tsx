"use client"

import { motion } from "framer-motion"
import { Flag, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface GameActionsProps {
  onResign?: () => void
  onOfferDraw?: () => void
  highlightOfferDraw?: boolean
}

export function GameActions({
  onResign,
  onOfferDraw,
  highlightOfferDraw = false,
}: GameActionsProps) {
  const [resignConfirmPending, setResignConfirmPending] = useState(false)
  const [drawOfferConfirmPending, setDrawOfferConfirmPending] = useState(false)

  // Reset confirmation states after a delay
  useEffect(() => {
    if (resignConfirmPending) {
      const timer = setTimeout(() => setResignConfirmPending(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [resignConfirmPending])

  useEffect(() => {
    if (drawOfferConfirmPending) {
      const timer = setTimeout(() => setDrawOfferConfirmPending(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [drawOfferConfirmPending])

  const handleResignClick = () => {
    if (resignConfirmPending) {
      onResign?.()
      setResignConfirmPending(false)
    } else {
      setResignConfirmPending(true)
    }
  }

  const handleDrawOfferClick = () => {
    if (drawOfferConfirmPending) {
      onOfferDraw?.()
      setDrawOfferConfirmPending(false)
    } else {
      setDrawOfferConfirmPending(true)
    }
  }

  const gameActions = [
    { 
      icon: Flag, 
      onClick: handleResignClick, 
      label: resignConfirmPending ? "Confirm Resign" : "Resign",
      confirmPending: resignConfirmPending
    },
    { 
      icon: Users, 
      onClick: handleDrawOfferClick, 
      label: drawOfferConfirmPending ? "Confirm Draw" : "Offer Draw",
      highlighted: highlightOfferDraw,
      confirmPending: drawOfferConfirmPending
    },
  ]

  return (
    <div className="flex gap-3 justify-center">
      {gameActions.map((action, index) => (
        <motion.button
          key={index}
          onClick={action.onClick}
          className={`
            p-3 rounded-full transition-all duration-200 text-white
            ${action.confirmPending 
              ? "bg-green-500 hover:bg-green-600" 
              : action.highlighted
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-brand-primary/60 hover:bg-brand-primary/80"
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={action.label}
        >
          <action.icon className="w-6 h-6" />
        </motion.button>
      ))}
    </div>
  )
}
