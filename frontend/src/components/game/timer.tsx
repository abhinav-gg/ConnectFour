"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import { cn } from "@/utils/cn"

interface TimerProps {
  millisecondsLeft: number
  isRunning: boolean
  color?: "red" | "yellow"
  lastMoveTimestamp?: number // Unix timestamp of the last move
  onTimeUp?: () => void
  isDisconnected?: boolean // New: indicates if the player is disconnected
  disconnectedRef?: React.MutableRefObject<boolean> // New: ref for disconnect state
}

export function Timer({
  millisecondsLeft,
  isRunning,
  color = "yellow",
  lastMoveTimestamp,
  onTimeUp,
  isDisconnected = false,
  disconnectedRef,
}: TimerProps) {
  const [displayMilliseconds, setDisplayMilliseconds] = useState(millisecondsLeft)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastReportedMillisecondsRef = useRef(millisecondsLeft)
  
  // Calculate disconnection timeout (30 seconds or their remaining time, whichever is less)
  const getDisconnectionTimeout = (): number => {
    const DISCONNECTION_TIMEOUT = 30 * 1000 // 30 seconds
    return Math.min(millisecondsLeft, DISCONNECTION_TIMEOUT)
  }
  
  // Check if player is currently disconnected (from ref or prop)
  const isPlayerDisconnected = disconnectedRef?.current ?? isDisconnected

  // Calculate accurate remaining time based on last move timestamp
  const calculateRemainingTime = (): number => {
    if (!isRunning) {
      return millisecondsLeft
    }
    
    // Handle disconnection mode
    if (isPlayerDisconnected) {
      const disconnectionTime = getDisconnectionTimeout()
      if (!lastMoveTimestamp) return disconnectionTime
      
      const currentTime = Date.now()
      const timeSinceLastMove = currentTime - lastMoveTimestamp
      const remaining = disconnectionTime - timeSinceLastMove
      return Math.max(0, remaining)
    }
    
    // Normal timer mode
    if (!lastMoveTimestamp) {
      return millisecondsLeft
    }

    const currentTime = Date.now()
    const timeSinceLastMove = currentTime - lastMoveTimestamp
    const remaining = millisecondsLeft - timeSinceLastMove

    return Math.max(0, remaining)
  }

  // Initialize or resume the timer
  useEffect(() => {
    if (isRunning || isPlayerDisconnected) {
      // Ensure the UI reflects the latest remaining time immediately
      setDisplayMilliseconds(calculateRemainingTime())
      intervalRef.current = setInterval(tick, 100) // Update every 100ms for smooth countdown
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Keep the last shown value; do not reset to avoid flashes
      setDisplayMilliseconds(calculateRemainingTime())
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, isPlayerDisconnected, lastMoveTimestamp, millisecondsLeft])

  // Update display when props change
  useEffect(() => {
    const remaining = calculateRemainingTime()
    setDisplayMilliseconds(remaining)
    lastReportedMillisecondsRef.current = remaining
  }, [millisecondsLeft, lastMoveTimestamp, isRunning, isPlayerDisconnected])

  const tick = () => {
    const remaining = calculateRemainingTime()
    setDisplayMilliseconds(remaining)

    // Check if time is up
    if (remaining <= 0) {
      clearInterval(intervalRef.current!)
      intervalRef.current = null
      onTimeUp?.()
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (totalSeconds < 10) {
      const centiseconds = Math.floor((ms % 1000) / 10) // Show centiseconds for urgency
      return `${seconds}.${centiseconds.toString().padStart(2, "0")}`
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Enhanced color logic for disconnection state
  const getTimerColorClass = () => {
    if (isPlayerDisconnected) {
      return "bg-black text-red-400 border-2 border-red-500" // Black background for disconnected
    }
    
    if (!isRunning) {
      return "bg-gray-400 text-gray-700"
    }
    
    return color === "yellow" ? "bg-brand-accent-yellow" : "bg-brand-accent-red"
  }

  return (
    <motion.div
      className={cn(
      "flex items-center gap-2 px-4 py-1 rounded-full text-sm font-semibold text-black",
      "w-28 min-w-28 max-w-28 justify-center whitespace-nowrap", // fixed width, prevent wrapping
      getTimerColorClass()
      )}
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Clock className="w-4 h-8 flex-shrink-0" />
      <span className="inline-block text-center w-12 font-mono tabular-nums">{formatTime(displayMilliseconds)}</span>
    </motion.div>
  )
}
