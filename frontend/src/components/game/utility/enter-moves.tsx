"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface EnterMovesProps {
  onSubmitMoves?: (moves: number[]) => void
  disabled?: boolean
  placeholder?: string
}

export function EnterMoves({
  onSubmitMoves,
  disabled = false,
  placeholder = "Enter moves",
}: EnterMovesProps) {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const validateMoves = (input: string): number[] | null => {
    const trimmed = input.trim()
    if (!trimmed) return []

    // Only accept a string of digits 1-7, no whitespace allowed
    if (!/^[1-7]+$/.test(trimmed)) {
      return null // Invalid input
    }
    // Convert each character to a number
    const moves = trimmed.split('').map(digit => Number(digit))

    return moves
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // Only allow numbers 1-7 and spaces
    const filteredValue = value.replace(/[^1-7]/g, '')
    setInputValue(filteredValue)

    // Clear error when user starts typing
    if (error) {
      setError("")
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 72 // 3 rows * 24px line height
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  const handleSubmit = () => {
    const moves = validateMoves(inputValue)
    
    if (moves === null) {
      setError("Invalid moves. Use numbers 1-7 separated by spaces.")
      return
    }

    if (moves.length === 0) {
      setError("Please enter at least one move.")
      return
    }

    // Submit the moves
    onSubmitMoves?.(moves)
    
    // Clear the input
    setInputValue("")
    setError("")
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-white text-lg font-bold text-center">Enter Moves</h3>
      
      <div className="space-y-2">
        {/* Textarea Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full min-h-[40px] max-h-[72px] resize-none overflow-y-auto
              rounded-md border px-3 py-2 text-sm text-white 
              placeholder:text-brand-text-muted
              bg-brand-primary/60 border-brand-border
              focus:outline-none focus:ring-2 focus:ring-brand-accent-blue focus:border-brand-accent-blue
              disabled:cursor-not-allowed disabled:opacity-50
              transition-all duration-200
              ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
            `}
            rows={1}
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            className="text-red-400 text-xs"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || !inputValue.trim()}
          className="w-full bg-brand-accent-green hover:bg-brand-accent-green/90 text-white font-medium"
          size="default"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Moves
        </Button>
      </div>
    </motion.div>
  )
}
