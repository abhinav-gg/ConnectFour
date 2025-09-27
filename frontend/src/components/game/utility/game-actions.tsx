"use client"

import { motion } from "framer-motion"
import { Flag, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface GameActionsProps {
  onResign?: () => void
  onOfferDraw?: () => void
  highlightOfferDraw?: boolean
  isDrawOffered?: boolean
  canResign?: boolean
  canOfferDraw?: boolean
}

export function GameActions({
  onResign,
  onOfferDraw,
  highlightOfferDraw = false,
  isDrawOffered = false,
  canResign = true,
  canOfferDraw = true,
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

  // Reset draw confirmation if draw is no longer available
  useEffect(() => {
    if (!canOfferDraw) {
      setDrawOfferConfirmPending(false)
    }
  }, [canOfferDraw])

  const handleResignClick = () => {
    if (!canResign) return
    
    if (resignConfirmPending) {
      onResign?.()
      setResignConfirmPending(false)
    } else {
      setResignConfirmPending(true)
    }
  }

  const handleDrawOfferClick = () => {
    if (!canOfferDraw) return
    
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
      label: resignConfirmPending ? "Confirm Resign?" : "Resign",
      confirmPending: resignConfirmPending,
      disabled: !canResign,
      className: resignConfirmPending 
        ? "bg-red-500 hover:bg-red-600 border-red-400" 
        : "bg-red-600/80 hover:bg-red-600 border-red-500/50",
      textColor: "text-white"
    },
    { 
      icon: Users, 
      onClick: handleDrawOfferClick, 
      label: isDrawOffered 
        ? "Draw Offered" 
        : drawOfferConfirmPending 
          ? "Confirm Draw?" 
          : "Offer Draw",
      confirmPending: drawOfferConfirmPending,
      disabled: !canOfferDraw,
      highlighted: highlightOfferDraw,
      className: isDrawOffered
        ? "bg-amber-600/80 hover:bg-amber-600 border-amber-500/50"
        : drawOfferConfirmPending 
          ? "bg-blue-500 hover:bg-blue-600 border-blue-400" 
          : highlightOfferDraw
            ? "bg-blue-600/80 hover:bg-blue-600 border-blue-500/50"
            : "bg-blue-600/80 hover:bg-blue-600 border-blue-500/50",
      textColor: "text-white"
    },
  ]

  return (
    <div className="flex gap-3 justify-center">
      {gameActions.map((action, index) => (
        <motion.button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`
            px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border
            ${action.disabled 
              ? "bg-gray-600/30 text-gray-400 cursor-not-allowed border-gray-600/30" 
              : `${action.className} ${action.textColor}`
            }
          `}
          whileHover={action.disabled ? {} : { scale: 1.02 }}
          whileTap={action.disabled ? {} : { scale: 0.98 }}
          animate={action.label === "Draw Offered" ? {
            boxShadow: [
              "0 0 0 0 rgba(245, 158, 11, 0.7)",
              "0 0 0 8px rgba(245, 158, 11, 0)",
              "0 0 0 0 rgba(245, 158, 11, 0.7)"
            ]
          } : {}}
          transition={action.label === "Draw Offered" ? {
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          } : {}}
        >
          <action.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
