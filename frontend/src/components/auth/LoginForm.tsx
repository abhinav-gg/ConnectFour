"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import { Layout } from "../mainlayout"
import { Board } from "../boards/Board"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("hello@example.co")
  const [password, setPassword] = useState("••••••••••••••")
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [showError, setShowError] = useState(true)


  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri = "http://localhost:3001/auth/google/callback"; // Update to your backend OAuth2 callback URL
    const scope = "openid email profile";
    const responseType = "code";
    const state = encodeURIComponent("some-random-string-or-csrf");
    // Optional but strongly recommended.
    // Used to pass a value (like CSRF token or tracking info) that will be returned to you, unchanged, by Google.
    // Helps you verify the response is legit.
    // We just use a static value here for demo.

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

    window.location.href = oauthUrl;
  };

  return (
    <Layout showHeader={true}>
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-16 items-center">
            {/* Left side - Connect 4 Board - Only show on XL screens and up */}
            <div className="hidden xl:flex justify-center">
              <Board interactive={false} animate_init={false} />
            </div>

            {/* Right side - Login Form - Full width on smaller screens, half width on XL+ */}
            <div className="w-full max-w-lg mx-auto xl:mx-0">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">Login</h1>
                  <p className="text-brand-text-light text-base lg:text-lg">
                    Welcome back. Enter your credentials to access your account
                  </p>
                </div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-base font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border border-brand-text-border rounded-lg px-4 py-3 text-white placeholder:text-brand-text-light focus:border-brand-accent-blue focus:ring-brand-accent-blue h-12"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-white text-base font-medium">
                        Password
                      </Label>
                      <button type="button" className="text-[#22c55e] text-sm hover:underline focus:underline">
                        Forgot Password
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`bg-transparent border rounded-lg px-4 py-3 text-white placeholder:text-brand-text-light focus:ring-1 pr-12 h-12 ${
                          showError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-brand-text-border focus:border-brand-accent-blue focus:ring-brand-accent-blue"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-text-light hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {showError && <p className="text-red-500 text-sm">Please enter correct password</p>}
                  </div>

                  {/* Keep me signed in */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="keep-signed-in"
                      checked={keepSignedIn}
                      onCheckedChange={setKeepSignedIn}
                      className="border-brand-text-border data-[state=checked]:bg-[#22c55e] data-[state=checked]:border-[#22c55e]"
                    />
                    <Label htmlFor="keep-signed-in" className="text-white text-base">
                      Keep me signed in
                    </Label>
                  </div>

                  {/* Continue Button */}
                  <Button
                    type="submit"
                    className="w-full bg-brand-accent-green hover:bg-brand-accent-green/90 text-white font-semibold py-3 rounded-lg h-12 text-base transition-colors"
                  >
                    Continue
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-brand-text-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-brand-primary px-4 text-brand-text-light">
                        or sign up with
                      </span>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <Button
                    type="button"
                    // variant="outline"
                    className="w-full bg-transparent border border-brand-text-border text-white hover:bg-[#595974] py-3 rounded-lg h-12 text-base transition-colors"
                    onClick={handleGoogleLogin}
                  >
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
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>

                  {/* Sign up link */}
                  <p className="text-center text-brand-text-light">
                    Don't have an Account?{" "}
                    <button type="button" className="text-[#22c55e] hover:underline focus:underline font-medium">
                      Sign up here
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
