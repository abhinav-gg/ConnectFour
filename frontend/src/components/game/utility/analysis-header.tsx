"use client"

import { motion } from "framer-motion"
import { Settings } from "lucide-react"
import { Toggle } from "@/components/ui/toggle" // Import the Toggle component
import { getEvaluationBadgeClasses, getEvaluationText } from "@/utils/colors"

interface AnalysisHeaderProps {
  isAnalysisEnabled: boolean
  isLoading?: boolean // New: loading state for better UX
  onToggleAnalysis: (enabled: boolean) => void
  onSettingsClick?: () => void
  showAnalysisToggle?: boolean
  evaluation?: number // Raw evaluation number for color determination and text formatting
}

export function AnalysisHeader({
  isAnalysisEnabled,
  isLoading = false,
  onToggleAnalysis,
  onSettingsClick,
  showAnalysisToggle = true, // Default to true for backward compatibility
  evaluation = 0, // Default to neutral evaluation
}: AnalysisHeaderProps) {
  
  // Determine badge color based on evaluation
  const getBadgeColor = () => {
    return getEvaluationBadgeClasses(evaluation)
  }

  // Get formatted evaluation text
  const evaluationText = getEvaluationText(evaluation)
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

            {/* Analysis Type Badge - Conditionally rendered with loading state */}
            {isAnalysisEnabled && (
              <motion.div
                className={`${getBadgeColor()} px-3 py-1 rounded-md font-bold text-sm flex items-center gap-2`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-2 h-2 bg-current rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    Loading...
                  </>
                ) : (
                  evaluationText
                )}
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
