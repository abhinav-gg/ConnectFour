"use client"

import { motion } from "framer-motion"
import { Settings } from "lucide-react"
import { Toggle } from "@/components/ui/toggle" // Import the Toggle component

interface AnalysisHeaderProps {
  analysisType?: string
  isAnalysisEnabled: boolean // Changed from isAnalysisComplete
  onToggleAnalysis: (enabled: boolean) => void // New prop for toggle change
  onSettingsClick?: () => void
  showAnalysisToggle?: boolean // New prop to control visibility of analysis features
}

export function AnalysisHeader({
  analysisType = "M42",
  isAnalysisEnabled,
  onToggleAnalysis,
  onSettingsClick,
  showAnalysisToggle = true, // Default to true for backward compatibility
}: AnalysisHeaderProps) {
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
                className="bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm"
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
