"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/utils/cn"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      onCheckedChange?.(event.target.checked)
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-brand-text-border bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-accent-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sr-only",
            className,
          )}
          onChange={handleChange}
          {...props}
        />
        <div className="h-4 w-4 shrink-0 rounded-sm border border-brand-text-border bg-transparent peer-checked:bg-brand-accent-green peer-checked:border-brand-accent-green peer-focus:ring-2 peer-focus:ring-brand-accent-green peer-focus:ring-offset-2 flex items-center justify-center">
          <Check className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
      </div>
    )
  },
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
