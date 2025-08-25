"use client"

import { motion } from "framer-motion"
import { forwardRef, useImperativeHandle } from "react"
import { getEvaluationColor, getEvaluationText, getEvaluationBackgroundClasses, type EvaluationColor } from "@/utils/colors"

interface ColumnAnalysisProps {
  evaluations?: number[] // Raw evaluation numbers array [col1, col2, ..., col7]
  onColumnClick?: (column: number) => void
  gameOver?: boolean
}

export interface ColumnAnalysisRef {
  makeMove: (column: number) => void
}

export const ColumnAnalysis = forwardRef<ColumnAnalysisRef, ColumnAnalysisProps>(
  ({ evaluations, onColumnClick, gameOver = false }, ref) => {
    
    useImperativeHandle(ref, () => ({
      makeMove: (column: number) => {
        if (!gameOver && onColumnClick) {
          onColumnClick(column)
        }
      }
    }))

    // Default evaluations for loading state (gray loading indicators)
    const defaultEvaluations = Array(7).fill(-1000) // Use -1000 to show FULL/gray state
    const columnEvaluations = evaluations || defaultEvaluations

    const handleColumnClick = (column: number, evaluation: number) => {
      // Don't allow clicks if game is over or column is full
      if (gameOver || evaluation === -1000) {
        return
      }
      
      if (onColumnClick) {
        onColumnClick(column - 1) // Convert to 0-based index for game logic
      }
    }

    return (
      <div className="flex gap-2 mb-6 w-full">
        {columnEvaluations.map((evaluation: number, index: number) => {
          const column = index + 1
          const evalText = getEvaluationText(evaluation)
          const isClickable = !gameOver && evaluation !== -1000
          
          return (
            <motion.div
              key={column}
              className={`
                flex flex-col items-center justify-center flex-1
                h-16 rounded-lg text-white font-bold text-sm
                ${getEvaluationBackgroundClasses(evaluation)}
                ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
              `}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={isClickable ? { scale: 1.05 } : {}}
              onClick={() => handleColumnClick(column, evaluation)}
            >
              <div className="text-base">{column}</div>
              <div className="text-xs leading-tight">{evalText}</div>
            </motion.div>
          )
        })}
      </div>
    )
  }
)

ColumnAnalysis.displayName = "ColumnAnalysis"
