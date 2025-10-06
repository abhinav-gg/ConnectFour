"use client"

import { motion } from "framer-motion"
import { Flag, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface GameActionsProps {
  onResign?: () => void
  onOfferDraw?: () => void
  onAcceptDraw?: () => void
  highlightOfferDraw?: boolean
  isDrawOffered?: boolean
  canResign?: boolean
  canOfferDraw?: boolean
  drawOfferedBy?: number | null
  isRedPlayer?: boolean
}

export function GameActions({
  onResign,
  onOfferDraw,
  onAcceptDraw,
  highlightOfferDraw = false,
  isDrawOffered = false,
  canResign = true,
  canOfferDraw = true,
  drawOfferedBy = null,
  isRedPlayer = false,
}: GameActionsProps) {
  const [resignConfirmPending, setResignConfirmPending] = useState(false)
  const [resignCountdown, setResignCountdown] = useState(0)
  const [drawOfferConfirmPending, setDrawOfferConfirmPending] = useState(false)
  const [acceptDrawConfirmPending, setAcceptDrawConfirmPending] = useState(false)

  // Reset resignation confirmation with countdown
  useEffect(() => {
    if (resignConfirmPending) {
      setResignCountdown(2)
      
      const interval = setInterval(() => {
        setResignCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setResignConfirmPending(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [resignConfirmPending])

  useEffect(() => {
    if (drawOfferConfirmPending) {
      const timer = setTimeout(() => setDrawOfferConfirmPending(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [drawOfferConfirmPending])

  useEffect(() => {
    if (acceptDrawConfirmPending) {
      const timer = setTimeout(() => setAcceptDrawConfirmPending(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [acceptDrawConfirmPending])

  // Reset draw confirmation if draw is no longer available
  useEffect(() => {
    if (!canOfferDraw) {
      setDrawOfferConfirmPending(false)
    }
    if (!isDrawOffered) {
      setAcceptDrawConfirmPending(false)
    }
  }, [canOfferDraw, isDrawOffered])

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

  const handleAcceptDrawClick = () => {
    if (acceptDrawConfirmPending) {
      onAcceptDraw?.()
      setAcceptDrawConfirmPending(false)
    } else {
      setAcceptDrawConfirmPending(true)
    }
  }

  // Determine if current player is receiving a draw offer
  const isReceivingDrawOffer = drawOfferedBy !== null && drawOfferedBy !== (isRedPlayer ? 0 : 1)
  const hasOfferedDraw = drawOfferedBy !== null && drawOfferedBy === (isRedPlayer ? 0 : 1)

  const gameActions = [
    { 
      icon: Flag, 
      onClick: handleResignClick, 
      label: resignConfirmPending ? `Confirm (${resignCountdown})` : "Resign",
      confirmPending: resignConfirmPending,
      disabled: !canResign,
      className: resignConfirmPending 
        ? "bg-red-500 hover:bg-red-600 border-red-400" 
        : "bg-red-600/80 hover:bg-red-600 border-red-500/50",
      textColor: "text-white"
    },
    isReceivingDrawOffer ? {
      icon: Users,
      onClick: handleAcceptDrawClick,
      label: acceptDrawConfirmPending ? "Accept Draw?" : "Accept Draw",
      confirmPending: acceptDrawConfirmPending,
      disabled: false,
      highlighted: true,
      className: acceptDrawConfirmPending
        ? "bg-green-500 hover:bg-green-600 border-green-400"
        : "bg-green-600/80 hover:bg-green-600 border-green-500/50",
      textColor: "text-white"
    } : { 
      icon: Users, 
      onClick: handleDrawOfferClick, 
      label: hasOfferedDraw
        ? "Draw Offered" 
        : drawOfferConfirmPending 
          ? "Confirm Draw?" 
          : "Offer Draw",
      confirmPending: drawOfferConfirmPending,
      disabled: !canOfferDraw,
      highlighted: highlightOfferDraw,
      className: hasOfferedDraw
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
            px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 border min-w-[120px]
            ${action.disabled 
              ? "bg-gray-600/30 text-gray-400 cursor-not-allowed border-gray-600/30" 
              : `${action.className} ${action.textColor}`
            }
          `}
          whileHover={action.disabled ? {} : { scale: 1.02 }}
          whileTap={action.disabled ? {} : { scale: 0.98 }}
          animate={(action.label === "Draw Offered" || action.label === "Accept Draw") ? {
            boxShadow: [
              action.label === "Accept Draw" 
                ? "0 0 0 0 rgba(34, 197, 94, 0.7)"
                : "0 0 0 0 rgba(245, 158, 11, 0.7)",
              action.label === "Accept Draw"
                ? "0 0 0 8px rgba(34, 197, 94, 0)"
                : "0 0 0 8px rgba(245, 158, 11, 0)",
              action.label === "Accept Draw"
                ? "0 0 0 0 rgba(34, 197, 94, 0.7)"
                : "0 0 0 0 rgba(245, 158, 11, 0.7)"
            ]
          } : {}}
          transition={(action.label === "Draw Offered" || action.label === "Accept Draw") ? {
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          } : {}}
        >
          <action.icon className="w-4 h-4" />
          <span className="text-sm font-medium text-center flex-1">{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
