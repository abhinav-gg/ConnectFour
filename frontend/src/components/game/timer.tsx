"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import { cn } from "@/utils/cn"

interface TimerProps {
  secondsLeft: number
  isRunning: boolean
  color?: "red" | "yellow"
  onTimeChange?: (newSeconds: number) => void
  onTimeUp?: () => void
}

export function Timer({
  secondsLeft,
  isRunning,
  color = "yellow",
  onTimeChange,
  onTimeUp,
}: TimerProps) {
  const [displayMilliseconds, setDisplayMilliseconds] = useState(secondsLeft * 1000)
  const totalTimeRef = useRef(secondsLeft * 1000)
  const startTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastReportedSecondRef = useRef(secondsLeft)

  // Initialize or resume the timer
  useEffect(() => {
    if (isRunning) {
      // If resuming, calculate based on current displayMilliseconds
      totalTimeRef.current = displayMilliseconds
      startTimeRef.current = Date.now()

      intervalRef.current = setInterval(tick, 10)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      startTimeRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  // If `secondsLeft` prop changes externally, reflect that
  useEffect(() => {
    if (!isRunning) {
      setDisplayMilliseconds(secondsLeft * 1000)
      totalTimeRef.current = secondsLeft * 1000
      lastReportedSecondRef.current = secondsLeft
    }
  }, [secondsLeft])

  const tick = () => {
    if (startTimeRef.current === null) return

    const elapsed = Date.now() - startTimeRef.current
    const remaining = totalTimeRef.current - elapsed

    const clamped = Math.max(0, remaining)
    setDisplayMilliseconds(clamped)

    const currentSeconds = Math.floor(clamped / 1000)
    if (onTimeChange && currentSeconds !== lastReportedSecondRef.current) {
      onTimeChange(currentSeconds)
      lastReportedSecondRef.current = currentSeconds
    }

    if (clamped <= 0) {
      clearInterval(intervalRef.current!)
      intervalRef.current = null
      startTimeRef.current = null
      onTimeUp?.()
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (totalSeconds < 10) {
      const centiseconds = Math.floor((ms % 1000) / 10)
      return `${seconds} : ${centiseconds.toString().padStart(2, "0")}`
    }

    return `${minutes} : ${seconds.toString().padStart(2, "0")}`
  }

  const timerColorClass =
    color === "yellow" ? "bg-brand-accent-yellow" : "bg-brand-accent-red"

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-4 py-1 rounded-full text-sm font-semibold text-black",
        "w-28 min-w-28 max-w-28 justify-center", // fixed width
        timerColorClass
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Clock className="w-4 h-4" />
      <span className="inline-block text-center w-12 tabular-nums">{formatTime(displayMilliseconds)}</span>
    </motion.div>
  )
}
