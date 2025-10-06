"use client"
import { useRecaptcha } from '@/components/providers/RecaptchaProvider'
import { useError } from '@/components/providers/ErrorProvider'
import type React from "react"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import { validateEmail, validateUsername } from "@shared/utils/validation"
import { APIResponse } from "@shared/types/Responses"
import { handleGoogleLogin } from "@/utils/googleSignin"
import { logger } from '@/utils/logger'
import { authApi } from "@/utils/apiClient"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const { getRecaptchaToken, activateRecaptcha, isRecaptchaActive } = useRecaptcha();
  const { showWarning } = useError();

  // Validation states
  const [emailValid, setEmailValid] = useState(false)

  useEffect(() => {
    activateRecaptcha();
  }, [activateRecaptcha]);

  // Real-time validation handlers
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value.trim() === "") {
      setEmailError(null)
      setEmailValid(false)
    } else if (validateEmail(value) || validateUsername(value)) {
      setEmailError(null)
      setEmailValid(true)
    } else {
      setEmailError("Please enter a valid email address or username.")
      setEmailValid(false)
    }
  }

  // Helper function to determine if input is email or username
  const getValidationType = (value: string): string => {
    if (value.includes('@')) {
      return "Valid Email"
    } else {
      return "Valid Username"
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value.trim() === "") {
      setPasswordError(null)
    } else {
      setPasswordError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    let hasError = false

    if (!emailValid) {
      setEmailError("Please enter a valid email address or username.")
      hasError = true
    }

    if (!password) {
      setPasswordError("Please enter your password.")
      hasError = true
    }

    const recaptchaToken = await getRecaptchaToken('contact_form');
    if (!recaptchaToken || !isRecaptchaActive) {
      showWarning('reCAPTCHA verification failed. Please try again.', 5);
      hasError = true
    }

    if (hasError) {
      return
    }

    setIsLoading(true)
    
    try {
      const response = await authApi.post<{ user: any; sessionToken: string }>('/login', {
        usernameEmail: email,
        password,
        recaptchaToken: recaptchaToken || undefined
      });
      
      logger.auth('Login response:', response);
      setIsLoading(false)
      
      if (response.success) {
        logger.auth("Login successful!")
        // redirect to /profile
        window.location.href = "/profile"
      } else {
        setLoginError(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      setIsLoading(false)
      setLoginError('An unexpected error occurred during login')
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
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
        <h1 className="text-3xl lg:text-4xl font-bold text-white select-none">Login</h1>
        <p className="text-brand-text-light text-base lg:text-lg select-none">
          Welcome back. Enter your credentials to access your account
        </p>
      </motion.div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Email Field */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Label htmlFor="email" className="select-none">
            Email or Username
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
            disabled={isLoading}
            placeholder="Enter your email or username"
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
                ✓ {getValidationType(email)}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Password Field */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="select-none">
              Password
            </Label>
            <motion.a
              href="/reset-password"
              className="text-brand-accent-green text-sm hover:underline focus:underline select-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Forgot Password
            </motion.a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`h-12 pr-12 rounded-md transition-all duration-200 hover:border-brand-accent-blue/50 focus:scale-[1.02] ${
                passwordError ? "border-red-500 focus:border-red-500 focus:ring-red-500" :
                password ? "border-green-500 focus:border-green-500 focus:ring-green-500" : ""
              }`}
              disabled={isLoading}
              placeholder="Enter your password"
            />
            <motion.button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-text-light hover:text-white transition-colors duration-200 p-1.5 rounded-md hover:bg-brand-hover/20 flex items-center justify-center"
              disabled={isLoading}
            >
              <AnimatePresence mode="wait">
                {showPassword ? (
                  <motion.div
                    key="eye-off"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EyeOff className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="eye"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Eye className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
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
            {!passwordError && password && (
              <motion.p
                className="text-green-500 text-sm select-none"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                ✓ Password provided
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Keep me signed in */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="flex items-center space-x-3">
            <Checkbox id="keep-signed-in" checked={keepSignedIn} onCheckedChange={setKeepSignedIn} disabled={isLoading} />
            <Label htmlFor="keep-signed-in" className="select-none">
              Keep me signed in
            </Label>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Button type="submit" className="w-full h-12 text-base relative overflow-hidden rounded-md" disabled={isLoading}>
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

        {/* Divider */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-text-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-brand-secondary px-4 text-brand-text-light select-none">or sign up with</span>
          </div>
        </motion.div>

        {/* Google Sign In */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base bg-transparent hover:bg-brand-hover/20 transition-all duration-200 rounded-md"
            disabled={isLoading}
            onClick={handleGoogleLogin}
          >
            <motion.div className="flex items-center" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.6.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </motion.div>
          </Button>
        </motion.div>

        {/* Login Error */}
        <AnimatePresence>
          {loginError && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-red-500 text-sm select-none">
                {loginError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign up link */}
        <motion.p
          className="text-center text-brand-text-light select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          Don't have an Account?{" "}
          <motion.a
            href="/register"
            className="text-brand-accent-green hover:underline focus:underline font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign up here
          </motion.a>
        </motion.p>
      </form>
    </motion.div>
  )
}
