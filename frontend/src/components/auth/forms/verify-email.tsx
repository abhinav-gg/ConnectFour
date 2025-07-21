"use client"

import type React from "react"

import type { ReactElement } from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function VerifyEmailForm(): ReactElement {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  // Remove focusedIndex state
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Take only the last character if multiple are pasted or overwriting

    setOtp(newOtp)
    setOtpError(null) // Clear error on change

    // Move focus to next input if a digit was entered and it's not the last input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // If current field has a value, clear it
        const newOtp = [...otp]
        newOtp[index] = ""
        setOtp(newOtp)
        setOtpError(null) // Clear error on change
      } else if (index > 0) {
        // If current field is empty, move to previous and clear it
        const newOtp = [...otp]
        newOtp[index - 1] = ""
        setOtp(newOtp)
        setOtpError(null) // Clear error on change
        inputRefs.current[index - 1]?.focus()
      }
      e.preventDefault() // Prevent default backspace behavior (e.g., navigating back in browser)
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData("text").trim()
    // Remove dashes and whitespaces for validation
    const cleanedData = pasteData.replace(/[-\s]/g, "")

    if (cleanedData.length === 6 && /^\d{6}$/.test(cleanedData)) {
      const newOtp = cleanedData.split("")
      setOtp(newOtp)
      setOtpError(null)
      // Move focus to the last input after pasting
      inputRefs.current[5]?.focus()
    } else {
      setOtpError("Invalid paste format. Please paste a 6-digit code.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError(null)

    const fullOtp = otp.join("")
    if (fullOtp.length !== 6 || !/^\d{6}$/.test(fullOtp)) {
      setOtpError("Please enter a valid 6-digit code.")
      return
    }

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    // Mock validation: assume '123456' is correct
    if (fullOtp === "123456") {
      console.log("Email verified!")
      // Redirect or show success
    } else {
      setOtpError("Invalid verification code. Please try again.")
    }
  }

  // Focus on the first empty input or the first input only on mount
  useEffect(() => {
    let didFocus = false;
    const firstEmptyIndex = otp.findIndex((digit) => !digit);
    if (firstEmptyIndex !== -1) {
      inputRefs.current[firstEmptyIndex]?.focus();
      didFocus = true;
    }
    if (!didFocus) {
      inputRefs.current[0]?.focus();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBorderColorClass = (index: number) => {
    const fullOtp = otp.join("");
    if (otpError) return "border-red-500 focus:border-red-500 focus:ring-red-500";
    if (fullOtp.length === 6 && /^\d{6}$/.test(fullOtp)) {
      return "border-green-500 focus:border-green-500 focus:ring-green-500";
    }
    // Alternating red/yellow for default and focus
    const colors = [
      "border-brand-accent-red focus:border-brand-accent-red focus:ring-brand-accent-red",
      "border-brand-accent-yellow focus:border-brand-accent-yellow focus:ring-brand-accent-yellow"
    ];
    return colors[index % 2];
  }

  return (
    <motion.div
      className="space-y-6 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h1 className="text-3xl lg:text-4xl font-bold text-white select-none">Verify Email</h1>
        <p className="text-brand-text-light text-base lg:text-lg select-none">
          Please check your emails and enter the code we sent to continue
        </p>
      </motion.div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <p className="text-white text-center font-medium">Email sent to a***7@gmail.com</p>
          <div className="flex justify-center items-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index} // Key directly on Input as Fragment is removed
                type="text"
                value={digit}
                onChange={(e) => { handleOtpChange(e, index); }}
                onFocus={() => {}} // Remove focusedIndex logic
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className={`w-12 h-12 text-center text-xl font-bold caret-transparent
                    ${otpError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : getBorderColorClass(index)}
                    focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-secondary
                    ${digit ? "bg-transparent" : "bg-transparent"}
                  `}
                disabled={isLoading}
                aria-label={`Digit ${index + 1} of verification code`}
                placeholder="X"
              />
              // Removed the dash span
            ))}
          </div>
          <AnimatePresence>
            {otpError && (
              <motion.p
                className="text-red-500 text-sm text-center select-none"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {otpError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Verify Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Button type="submit" className="w-full h-12 text-base relative overflow-hidden" disabled={isLoading}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                </motion.div>
              ) : (
                <motion.span key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Verify
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </form>
    </motion.div>
  )
}
