"use client"

import { motion } from "framer-motion"

interface ColumnAnalysisData {
  column: number
  evaluation: string // "M41", "M31", "Draw", "Full", etc.
  color: "red" | "yellow" | "green" | "gray"
}

interface ColumnAnalysisProps {
  analyses?: ColumnAnalysisData[]
}

export function ColumnAnalysis({ analyses }: ColumnAnalysisProps) {
  const defaultAnalyses: ColumnAnalysisData[] = [
    { column: 1, evaluation: "M41", color: "red" },
    { column: 2, evaluation: "M31", color: "yellow" },
    { column: 3, evaluation: "Draw", color: "gray" }, // Changed to gray
    { column: 4, evaluation: "Full", color: "gray" }, // Changed to gray
    { column: 5, evaluation: "M41", color: "red" },
    { column: 6, evaluation: "M41", color: "yellow" },
    { column: 7, evaluation: "M41", color: "red" },
  ]

  const analysisData = analyses || defaultAnalyses

  const getBackgroundColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-brand-accent-red"
      case "yellow":
        return "bg-brand-accent-yellow"
      case "green":
        return "bg-brand-accent-green"
      case "gray": // Added gray case
        return "bg-brand-text-muted"
      default:
        return "bg-brand-text-muted"
    }
  }

  return (
    <div className="flex gap-2 mb-6 w-full">
      {" "}
      {/* Added w-full */}
      {analysisData.map((analysis, index) => (
        <motion.div
          key={analysis.column}
          className={`
            flex flex-col items-center justify-center flex-1
            h-16 rounded-lg text-white font-bold text-sm
            ${getBackgroundColor(analysis.color)}
          `}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-base">{analysis.column}</div> {/* Increased font size */}
          <div className="text-xs leading-tight">{analysis.evaluation}</div>
        </motion.div>
      ))}
    </div>
  )
}
