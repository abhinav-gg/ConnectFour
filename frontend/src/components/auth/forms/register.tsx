"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox" // Import Checkbox
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { validateEmail, validateUsername, validatePassword } from "@shared/utils/validation"
import { myConfig } from "@/config/env"
import { jwtDecode } from "jwt-decode";
import { UserAccountProvider } from "@shared/types/users"
import { maskEmail } from "@/utils/masks"
import { handleGoogleLogin } from "@/utils/googleSignin"


export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [termsError, setTermsError] = useState<string | null>(null)
  
  // Validation states
  const [emailValid, setEmailValid] = useState(false)
  const [usernameValid, setUsernameValid] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  // Stage state
  const [stage, setStage] = useState<1 | 2>(1)
  // Animation direction: 1 = forward, -1 = backward
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(1)
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [jwtEmail, setJwtEmail] = useState<string | null>(null);
  const [jwtProvider, setJwtProvider] = useState<UserAccountProvider | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const jwt = params.get("jwt");
      if (jwt) {
        setJwtToken(jwt);
        try {
          const decoded: any = jwtDecode(jwt);
          console.log(decoded)
          if (decoded && decoded.email) {
            setJwtEmail(decoded.email);
            setJwtProvider(decoded.provider)
            setEmail(decoded.email);
            setEmailValid(true);
            setStage(2);
          }
        } catch (e) {
          // Invalid JWT, ignore
        }
      }
    }
  }, []);

  // Real-time validation handlers
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

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    if (value.trim() === "") {
      setUsernameError(null)
      setUsernameValid(false)
    } else if (validateUsername(value)) {
      setUsernameError(null)
      setUsernameValid(true)
    } else {
      setUsernameError("3-20 chars, start with a letter. letters, numbers and -._ only.")
      setUsernameValid(false)
    }
  }

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

  // Stage 1 submit handler
  const handleStage1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    let hasError = false
    if (!emailValid) {
      setEmailError("Please enter a valid email address.")
      hasError = true
    }
    if (!passwordValid) {
      setPasswordError("Password must be at least 12 characters with uppercase, lowercase, number, and special character.")
      hasError = true
    }
    if (hasError) {
      return
    }
    setIsLoading(true)


    // TODO: ADD RECAPTCHA)
    await fetch(`${myConfig.BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    
    setIsLoading(false)
    setTransitionDirection(1)
    setStage(2)
  }

  // Stage 2 submit handler (final registration)
  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTermsError(null);
    let hasError = false;
    if (!usernameValid) {
      setUsernameError("Username must be 3-20 characters, start with a letter, and contain only letters, numbers, underscores, dots, and hyphens.");
      hasError = true;
    }
    if (!acceptTerms) {
      setTermsError("You must accept the Terms of Service and Privacy Policy.");
      hasError = true;
    }
    if (hasError) {
      return;
    }
    setIsLoading(true);
    if (jwtToken && jwtEmail && jwtProvider === UserAccountProvider.Google) {
      // Google registration
      const response = await fetch(`${myConfig.BACKEND_URL}/auth/google/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, token: jwtToken }),
      });
      setIsLoading(false);
      // In a real app, you'd handle success/failure here
      if (response.ok) {
        window.location.href = "/profile";
      } else {
        const data = await response.json();
        setUsernameError(data.error || "Registration failed");
      }
    } else {
      // Local registration fallback (should not happen with jwt)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsLoading(false);
      console.log("Registration successful:", { username, email, password });
    }
  };

  // Back button handler
  const handleBack = () => {
    setTransitionDirection(-1)
    setStage(1)
  }

  return (
    <motion.div
      className="space-y-5 select-none"
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
        <div className="flex items-center gap-2">
          {stage === 2 && (
            <span
              onClick={handleBack}
              className="flex items-center cursor-pointer group mr-1"
              tabIndex={0}
              aria-label="Back"
              role="button"
              style={{ outline: 'none' }}
            >
              <ArrowLeft className="w-7 h-7 text-white group-hover:text-brand-accent-green transition-colors duration-150" />
            </span>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold text-white select-none">Register</h1>
        </div>
        <p className="text-brand-text-light text-base lg:text-lg select-none">Welcome!</p>
      </motion.div>
      {/* Animated stage switcher */}
      <AnimatePresence mode="wait" initial={false}>
        {stage === 1 && (
          <motion.form
            key="stage1"
            className="space-y-5"
            onSubmit={handleStage1Submit}
            initial={{ opacity: 0, x: transitionDirection === 1 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: transitionDirection === 1 ? -40 : 40 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {/* Email Field */}
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
                disabled={isLoading}
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
            </motion.div>
            {/* Password Field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Label htmlFor="password" className="select-none">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`h-12 pr-12 rounded-md transition-all duration-200 hover:border-brand-accent-blue/50 focus:scale-[1.02] ${
                    passwordError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : 
                    passwordValid ? "border-green-500 focus:border-green-500 focus:ring-green-500" : ""
                  }`}
                  disabled={isLoading}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-text-light hover:text-white transition-colors duration-200 p-1.5 rounded-md hover:bg-brand-hover/20 flex items-center justify-center"
                  disabled={isLoading}
                >
                  <AnimatePresence mode="wait">
                    {showPassword ? (
                      <motion.div
                        key="eye-off"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <EyeOff className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="eye"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Eye className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
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
                {passwordValid && !passwordError && (
                  <motion.p
                    className="text-green-500 text-sm select-none"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    ✓ Strong password
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
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
          </motion.form>
        )}
        {stage === 2 && (
          <motion.form
            key="stage2"
            className="space-y-5"
            onSubmit={handleStage2Submit}
            initial={{ opacity: 0, x: transitionDirection === 1 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: transitionDirection === 1 ? -40 : 40 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {/* Google Email Label */}
            {jwtEmail && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Label className="select-none text-brand-text-light">
                  Sign up for {maskEmail(jwtEmail)}
                </Label>
              </motion.div>
            )}
            {/* Username Field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Label htmlFor="username" className="select-none">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`h-12 rounded-md transition-all duration-200 hover:border-brand-accent-blue/50 focus:scale-[1.02] ${
                  usernameError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : 
                  usernameValid ? "border-green-500 focus:border-green-500 focus:ring-green-500" : ""
                }`}
                disabled={isLoading}
                placeholder="Please create a username"
              />
              <AnimatePresence>
                {usernameError && (
                  <motion.p
                    className="text-red-500 text-sm select-none"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {usernameError}
                  </motion.p>
                )}
                {usernameValid && !usernameError && (
                  <motion.p
                    className="text-green-500 text-sm select-none"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    ✓ Valid username
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Accept Terms Checkbox */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="accept-terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => {
                    setAcceptTerms(checked as boolean)
                    if (checked) {
                      setTermsError(null)
                    }
                  }}
                  disabled={isLoading}
                />
                <Label htmlFor="accept-terms" className="text-brand-text-light text-sm select-none cursor-pointer">
                  I accept the{" "}
                  <a href="#" className="text-brand-accent-green hover:underline focus:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-brand-accent-green hover:underline focus:underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>
              <AnimatePresence>
                {termsError && (
                  <motion.p
                    className="text-red-500 text-sm select-none"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {termsError}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Register Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <Button type="submit" className="w-full h-12 text-base relative overflow-hidden rounded-md flex items-center justify-center gap-2" disabled={isLoading}>
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
                    <motion.span key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <span
                        onClick={e => {
                          e.preventDefault();
                          handleBack();
                        }}
                        className="mr-1 flex items-center cursor-pointer group"
                        tabIndex={0}
                        aria-label="Back"
                        role="button"
                        style={{ outline: 'none' }}
                      >
                      </span>
                      Register
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
      {/* Divider and Google Sign Up, Sign in link only on stage 1 */}
      {stage === 1 && (
        <>
          {/* Divider */}
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-text-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-brand-secondary px-4 text-brand-text-light select-none">or sign up with</span>
            </div>
          </motion.div>
          {/* Google Sign Up */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
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
          {/* Sign in link */}
          <motion.p
            className="text-center text-brand-text-light select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.1 }}
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
        </>
      )}
    </motion.div>
  )
}
