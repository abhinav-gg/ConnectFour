"use client"

import { motion } from "framer-motion"
import { Settings } from "lucide-react"
import { Toggle } from "@/components/ui/toggle" // Import the Toggle component
import { getEvaluationBadgeClasses } from "@/utils/colors"

interface AnalysisHeaderProps {
  analysisType?: string
  isAnalysisEnabled: boolean
  onToggleAnalysis: (enabled: boolean) => void
  onSettingsClick?: () => void
  showAnalysisToggle?: boolean
  evaluation?: number // New: raw evaluation for color determination
}

export function AnalysisHeader({
  analysisType = "M42",
  isAnalysisEnabled,
  onToggleAnalysis,
  onSettingsClick,
  showAnalysisToggle = true, // Default to true for backward compatibility
  evaluation = 0, // Default to neutral evaluation
}: AnalysisHeaderProps) {
  
  // Determine badge color based on evaluation and analysis type
  const getBadgeColor = () => {
    return getEvaluationBadgeClasses(evaluation)
  }
  return (
    <motion.div
      className="flex items-center justify-between p-3 mb-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        {/* Analysis Toggle - Only show if showAnalysisToggle is true */}
        {showAnalysisToggle && (
          <>
            <Toggle checked={isAnalysisEnabled} onCheckedChange={onToggleAnalysis} />

            {/* Analysis Type Badge - Conditionally rendered */}
            {isAnalysisEnabled && (
              <motion.div
                className={`${getBadgeColor()} px-3 py-1 rounded-md font-bold text-sm`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {analysisType}
              </motion.div>
            )}
          </>
        )}

        <span className="text-white font-semibold text-lg">
          {showAnalysisToggle ? "Analysis" : "Game Controls"}
        </span>
      </div>

      {/* Settings Button */}
      <button onClick={onSettingsClick} className="text-white hover:text-brand-text-muted transition-colors p-2">
        <Settings className="w-6 h-6" />
      </button>
    </motion.div>
  )
}
