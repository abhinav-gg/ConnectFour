import * as React from "react"
import { cn } from "@/utils/cn"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-brand-text-border bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent-blue focus:border-brand-accent-blue disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
