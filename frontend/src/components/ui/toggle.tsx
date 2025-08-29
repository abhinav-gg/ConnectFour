"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/utils/cn"

interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

// Hook to detect screen size
const useIsLargeScreen = () => {
  const [isLarge, setIsLarge] = React.useState(false)
  
  React.useEffect(() => {
    const checkSize = () => setIsLarge(window.innerWidth >= 1024)
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])
  
  return isLarge
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onCheckedChange, className, ...props }, ref) => {
    const isLargeScreen = useIsLargeScreen()
    
    return (
      <button
        ref={ref}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          `relative flex-shrink-0 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent-green focus:ring-offset-2 focus:ring-offset-brand-secondary`,
          checked ? "bg-brand-accent-green shadow-lg" : "bg-brand-primary/60 border border-brand-border",
          "w-12 h-6 lg:w-14 lg:h-7", // Base size for toggle
          className,
        )}
        role="switch"
        aria-checked={checked}
        {...props}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 lg:w-6 lg:h-6 bg-white rounded-full shadow-md"
          animate={{ 
            x: checked ? (isLargeScreen ? 28 : 24) : 0 // 24px for base (w-12 - w-5 - padding), 28px for lg (w-14 - w-6 - padding)
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    )
  },
)
Toggle.displayName = "Toggle"

export { Toggle }
