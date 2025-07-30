"use client"

import { motion } from "framer-motion"

interface PuzzleProgressProps {
  puzzleResults?: Array<"success" | "failure">
  maxVisible?: number
}

export function PuzzleProgress({ puzzleResults = [], maxVisible = 50 }: PuzzleProgressProps) {
  // Create a grid layout - 10 columns for desktop, 8 for tablet, 6 for mobile
  const visibleResults = puzzleResults.slice(0, maxVisible)

  // Fill remaining slots with empty placeholders if needed
  const totalSlots = Math.max(20, Math.ceil(visibleResults.length / 10) * 10)
  const slots = [...visibleResults]
  while (slots.length < totalSlots && slots.length < maxVisible) {
    slots.push(null as any)
  }

  return (
    <motion.div
      className="bg-brand-secondary rounded-2xl p-4 lg:p-6 shadow-lg border border-brand-border/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <motion.h3
        className="text-lg lg:text-xl font-bold text-white mb-3 lg:mb-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Recent Puzzles
      </motion.h3>

      <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1.5 lg:gap-2">
        {slots.map((result, index) => (
          <motion.div
            key={index}
            className={`
              h-4 lg:h-5 rounded-full transition-all duration-200
              ${
                result === "success"
                  ? "bg-brand-accent-green shadow-md"
                  : result === "failure"
                    ? "bg-brand-accent-red shadow-md"
                    : "bg-brand-primary/30 border border-brand-border/30"
              }
            `}
            style={{
              aspectRatio: "2/1", // 2:1 width to height ratio (3 times wider than 1:2)
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.5 + index * 0.02,
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            whileHover={{
              scale: result ? 1.2 : 1.1,
              y: -1,
            }}
          />
        ))}
      </div>

      {visibleResults.length > 0 && (
        <motion.div
          className="mt-3 lg:mt-4 text-center text-brand-text-muted text-xs lg:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="text-brand-accent-green font-medium">
            {visibleResults.filter((r) => r === "success").length}
          </span>
          {" solved, "}
          <span className="text-brand-accent-red font-medium">
            {visibleResults.filter((r) => r === "failure").length}
          </span>
          {" failed"}
        </motion.div>
      )}
    </motion.div>
  )
}
