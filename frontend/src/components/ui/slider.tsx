"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/utils/cn"

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, className }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative h-2 bg-brand-primary/60 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-brand-accent-cyan rounded-full"
          style={{ width: `${percentage}%` }}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        {/* Knob for the slider */}
        <motion.div
          className="absolute top-1/2 w-5 h-5 bg-brand-accent-cyan rounded-full shadow-md transform -translate-y-1/2 -translate-x-1/2 cursor-pointer z-30 pointer-events-none border border-brand-border" /* Adjusted size, added border */
          style={{ left: `${percentage}%` }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 pointer-events-auto"
      />
    </div>
  )
}
