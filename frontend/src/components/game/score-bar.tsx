"use client"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "@/utils/cn"
import { useEffect } from "react"

interface ScoreBarProps {
  scoreRatio: number // 0 (all red) to 1 (all yellow), controlled by parent
  className?: string
  topRed?: boolean // if true, red is on top; if false, red is on bottom
  display?: boolean // if false, the score bar won't be displayed, but still maintains its space
}

export function ScoreBar({ scoreRatio, className, topRed = true, display = true }: ScoreBarProps) {
  const animatedScoreRatio = useMotionValue(scoreRatio)
  const yellowHeight = useTransform(animatedScoreRatio, (ratio) => `${ratio * 100}%`)
  const redHeight = useTransform(animatedScoreRatio, (ratio) => `${(1 - ratio) * 100}%`)

  // Animate the motion value whenever the scoreRatio prop changes
  useEffect(() => {
    animate(animatedScoreRatio, scoreRatio, { type: "spring", stiffness: 100, damping: 20 })
  }, [scoreRatio, animatedScoreRatio])

  // If topRed is false, invert the bar so yellow is on top and red fills from bottom
  // We do this by flipping the flex direction and swapping the color backgrounds
  const containerClass = cn(
    "relative w-6 h-full rounded-full overflow-hidden",
    topRed ? "flex flex-col-reverse bg-brand-accent-red" : "flex flex-col-reverse bg-brand-accent-yellow",
    !display && "opacity-0", // Make invisible but keep the space
    className
  )

  return (
    <div className={containerClass}>
      {topRed ? (
        <motion.div
          className="absolute bottom-0 left-0 w-full bg-brand-accent-yellow rounded-b-full"
          style={{ height: yellowHeight }}
        />
      ) : (
        <motion.div
          className="absolute bottom-0 left-0 w-full bg-brand-accent-red rounded-b-full"
          style={{ height: redHeight }}
        />
      )}
    </div>
  )
}