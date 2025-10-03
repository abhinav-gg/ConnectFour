"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { logger, printl } from '@/utils/logger'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateEmail } from "@/../../shared/utils/validation"
import { useEffect } from "react"
import { validatePassword } from "@/../../shared/utils/validation";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  // Validation states
  const [emailValid, setEmailValid] = useState(false)

  // --- New for reset-token ---
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordValid, setPasswordValid] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [verifyingToken, setVerifyingToken] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const token = params.get("reset-token")
      if (token) {
        setResetToken(token)
        setVerifyingToken(true)
        // Simulate backend verification
        setTimeout(() => {
          setVerifyingToken(false)
          setShowPasswordForm(true)
        }, 1500)
      }
    }
  }, [])

  // Real-time validation handler
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value.trim() === "") {
      setEmailError(null)
      setEmailValid(false)
    } else if (validateEmail(value)) {
      setEmailError(null)
      setEmailValid(true)
    } else {
      setEmailError("Please enter a valid email address.")
      setEmailValid(false)
    }
  }

  // Password validation (same as register)
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value.trim() === "") {
      setPasswordError(null)
      setPasswordValid(false)
    } else if (validatePassword(value)) {
      setPasswordError(null)
      setPasswordValid(true)
    } else {
      setPasswordError("Password must be 12+ chars with upper, lower, number & symbol.")
      setPasswordValid(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (resetToken && showPasswordForm) {
      // Password submit step
      if (!passwordValid) {
        setPasswordError("Password must be 12+ chars with upper, lower, number & symbol.")
        return
      }
      setIsLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsLoading(false)
      // Placeholder: API call with resetToken and password
      logger.auth("Reset password with token:", resetToken, "new password:", password)
      // Optionally show a success message here
      return
    }
    // Email submit (no token)
    if (!emailValid) {
      setEmailError("Please enter a valid email address.")
      return
    }
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    // In a real app, you'd handle success/failure here
    logger.auth("Password reset email sent to:", email)
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
        <h1 className="text-3xl lg:text-4xl font-bold text-white select-none">Reset password</h1>
        <p className="text-brand-text-light text-base lg:text-lg select-none">
          {resetToken && showPasswordForm
            ? "Enter your new password below."
            : "Enter your email address and we'll send you a link to reset your password"}
        </p>
      </motion.div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {resetToken && showPasswordForm ? (
          // New password field
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Label htmlFor="password" className="select-none">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`h-12 rounded-md transition-all duration-200 hover:border-brand-accent-blue/50 focus:scale-[1.02] ${
                passwordError ? "border-red-500 focus:border-red-500 focus:ring-red-500" :
                passwordValid ? "border-green-500 focus:border-green-500 focus:ring-green-500" : ""
              }`}
              disabled={isLoading}
              placeholder="Enter your new password"
            />
            <AnimatePresence>
              {passwordError && (
                <motion.p
                  className="text-red-500 text-sm select-none"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {passwordError}
                </motion.p>
              )}
              {passwordValid && !passwordError && (
                <motion.p
                  className="text-green-500 text-sm select-none"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ✓ Looks good
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          // Email field
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Label htmlFor="email" className="select-none">
              Email Address
            </Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`h-12 rounded-md transition-all duration-200 hover:border-brand-accent-blue/50 focus:scale-[1.02] ${
                emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" :
                emailValid ? "border-green-500 focus:border-green-500 focus:ring-green-500" : ""
              }`}
              disabled={isLoading || verifyingToken}
              placeholder="Enter your email"
            />
            <AnimatePresence>
              {emailError && (
                <motion.p
                  className="text-red-500 text-sm select-none"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {emailError}
                </motion.p>
              )}
              {emailValid && !emailError && (
                <motion.p
                  className="text-green-500 text-sm select-none"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ✓ Valid email address
                </motion.p>
              )}
            </AnimatePresence>
            {verifyingToken && (
              <div className="text-brand-text-light text-sm mt-2">Verifying reset link...</div>
            )}
          </motion.div>
        )}

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Button type="submit" className="w-full h-12 text-base relative overflow-hidden rounded-md" disabled={isLoading || verifyingToken}>
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
                <motion.span key="continue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Continue
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Sign in link */}
        {!resetToken && (
          <motion.p
            className="text-center text-brand-text-light select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            Have an account?{" "}
            <motion.a
              href="/login"
              className="text-brand-accent-green hover:underline focus:underline font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign in here
            </motion.a>
          </motion.p>
        )}
      </form>
    </motion.div>
  )
}
