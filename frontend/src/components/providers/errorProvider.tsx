"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ErrorMessage {
  id: string
  message: string
  type?: "error" | "warning" | "info"
  duration?: number // Auto-dismiss duration in ms (0 = no auto-dismiss)
}

interface ErrorContextValue {
  showError: (message: string, type?: ErrorMessage["type"], duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  dismissError: (id: string) => void
  clearAllErrors: () => void
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined)

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider")
  }
  return context
}

interface ErrorProviderProps {
  children: React.ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorMessage[]>([])

  const dismissError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const showError = useCallback((message: string, type: ErrorMessage["type"] = "error", duration = 5) => {
    const id = Math.random().toString(36).substr(2, 9)
    const millisecondDuration = duration * 1000 // Convert seconds to milliseconds
    const newError: ErrorMessage = { id, message, type, duration: millisecondDuration }

    setErrors(prev => [...prev, newError])

    // Auto-dismiss if duration is set and greater than 0
    if (millisecondDuration > 0) {
      setTimeout(() => {
        dismissError(id)
      }, millisecondDuration)
    }
  }, [dismissError])

  const showWarning = useCallback((message: string, duration = 5) => {
    showError(message, "warning", duration)
  }, [showError])

  const showInfo = useCallback((message: string, duration = 5) => {
    showError(message, "info", duration)
  }, [showError])

  const clearAllErrors = useCallback(() => {
    setErrors([])
  }, [])

  const getErrorStyles = (type: ErrorMessage["type"]) => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-gradient-to-r from-yellow-600 to-yellow-700",
          border: "border-yellow-500",
          icon: "text-yellow-200",
          text: "text-yellow-100"
        }
      case "info":
        return {
          bg: "bg-gradient-to-r from-blue-600 to-blue-700",
          border: "border-blue-500",
          icon: "text-blue-200",
          text: "text-blue-100"
        }
      case "error":
      default:
        return {
          bg: "bg-gradient-to-r from-red-600 to-red-700",
          border: "border-red-500",
          icon: "text-red-200",
          text: "text-red-100"
        }
    }
  }

  const value: ErrorContextValue = {
    showError,
    showWarning,
    showInfo,
    dismissError,
    clearAllErrors
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
      
      {/* Error popup container at bottom of screen - Full width */}
      <div className="fixed bottom-0 left-0 right-0 z-[10000] pointer-events-none">
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-4">
          <AnimatePresence>
            {errors.map((error, index) => {
              const styles = getErrorStyles(error.type)
              // Calculate how many errors are newer than this one (higher index)
              const newerErrorsCount = errors.length - 1 - index
              
              return (
                <motion.div
                  key={error.id}
                  initial={{ 
                    opacity: 0, 
                    y: 100, 
                    scale: 0.95 
                  }}
                  animate={{ 
                    opacity: 1, 
                    y: -(newerErrorsCount), // Only push up by newer errors
                    scale: 1 
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 100, 
                    scale: 0.95,
                    transition: { duration: 0.2 }
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30 
                  }}
                  className={`
                    ${styles.bg} ${styles.border} border-2 sm:border-4 rounded-2xl sm:rounded-3xl 
                    p-4 sm:p-6 lg:p-8 mb-2 sm:mb-4 shadow-2xl
                    pointer-events-auto backdrop-blur-sm w-full max-w-6xl mx-auto
                  `}
                  style={{
                    zIndex: 10000 + index, // Higher index = higher z-index (newer errors on top)
                  }}
                >
                  <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                    {/* Error Icon - Responsive size */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.1,
                        type: "spring", 
                        stiffness: 200 
                      }}
                    >
                      <AlertCircle className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 ${styles.icon} flex-shrink-0 mt-0.5 sm:mt-1`} />
                    </motion.div>

                    {/* Error Message - Responsive text */}
                    <motion.div
                      className="flex-grow"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <p className={`${styles.text} text-sm sm:text-base lg:text-lg xl:text-xl font-medium leading-relaxed`}>
                        {error.message}
                      </p>
                    </motion.div>

                    {/* Close Button - Responsive size */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <Button
                        onClick={() => dismissError(error.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-0 hover:bg-white/20 rounded-full flex-shrink-0"
                      >
                        <X className={`w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 ${styles.icon}`} />
                      </Button>
                    </motion.div>
                  </div>

                  {/* Progress bar for auto-dismiss - Only show if duration exists and is greater than 0 */}
                  {error.duration && (error.duration > 0) && (
                    <motion.div
                      className="mt-3 sm:mt-4 lg:mt-6 h-1 sm:h-1.5 lg:h-2 bg-white/20 rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        className="h-full bg-white/40 rounded-full"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ 
                          duration: error.duration / 1000,
                          ease: "linear"
                        }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </ErrorContext.Provider>
  )
}
