"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/utils/cn"
import { motion, AnimatePresence } from "framer-motion"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, checked, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      onCheckedChange?.(event.target.checked)
    }

    // Use internal state if `checked` prop is not provided (uncontrolled component)
    // Otherwise, use the `checked` prop (controlled component)
    const [internalChecked, setInternalChecked] = React.useState(false)
    const isControlled = typeof checked === "boolean"
    const currentChecked = isControlled ? checked : internalChecked

    const handleInternalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(event.target.checked)
      }
      handleChange(event)
    }

    return (
      <div className={cn("relative inline-flex items-center justify-center group p-2 cursor-pointer", className)}>
        <input
          type="checkbox"
          ref={ref}
          className="absolute inset-0 peer h-full w-full shrink-0 rounded-sm border border-brand-text-border bg-transparent focus:outline-none focus:ring-0 disabled:cursor-not-allowed opacity-0 z-10" // Make input cover the whole padded area, but invisible
          onChange={handleInternalChange}
          checked={currentChecked} // Use currentChecked for controlled/uncontrolled behavior
          {...props}
        />
        {/* Visual checkbox box */}
        <div className="relative h-4 w-4 shrink-0 rounded-sm border border-brand-text-border bg-transparent peer-checked:bg-brand-accent-green peer-checked:border-brand-accent-green flex items-center justify-center transition-all duration-200 z-0">
          <AnimatePresence>
            {currentChecked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Check className="h-3 w-3 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  },
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
