"use client"

import { motion } from "framer-motion"
import { forwardRef, useImperativeHandle } from "react"
import { getEvaluationColor, getEvaluationText, getEvaluationBackgroundClasses, type EvaluationColor, playableEvaluation } from "@/utils/colors"

interface ColumnAnalysisProps {
  evaluations?: number[] // Raw evaluation numbers array [col1, col2, ..., col7]
  isLoading?: boolean // Loading state for better UX
  onColumnClick?: (column: number) => void
  gameOver?: boolean
}

export interface ColumnAnalysisRef {
  makeMove: (column: number) => void
}

export const ColumnAnalysis = forwardRef<ColumnAnalysisRef, ColumnAnalysisProps>(
  ({ evaluations, isLoading = false, onColumnClick, gameOver = false }, ref) => {
    
    useImperativeHandle(ref, () => ({
      makeMove: (column: number) => {
        if (!gameOver && onColumnClick) {
          onColumnClick(column)
        }
      }
    }))

    // Default evaluations for loading state (gray loading indicators)
    const defaultEvaluations = [0, 0, 0, 0, 0, 0, 0]
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
          const evalText = isLoading ? "..." : getEvaluationText(evaluation)
          const isClickable = !gameOver && playableEvaluation(evaluation) && !isLoading

          return (
            <motion.div
              key={column}
              className={`
                flex flex-col items-center justify-center flex-1
                h-16 rounded-lg text-white font-bold text-sm
                ${isLoading ? "bg-gray-600" : getEvaluationBackgroundClasses(evaluation)}
                ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
              `}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={isClickable ? { scale: 1.05 } : {}}
              onClick={() => handleColumnClick(column, evaluation)}
            >
              <div className="text-base">{column}</div>
              <div className="text-xs leading-tight flex items-center gap-1">
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-1 h-1 bg-current rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.1 }}
                    />
                    <motion.div
                      className="w-1 h-1 bg-current rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.1 + 0.2 }}
                    />
                    <motion.div
                      className="w-1 h-1 bg-current rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.1 + 0.4 }}
                    />
                  </>
                ) : (
                  evalText
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }
)

ColumnAnalysis.displayName = "ColumnAnalysis"
