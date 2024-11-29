'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'
import MainLogoAnimated from '@/components/mainlogo_animated'

function TypewriterText({ text, delay = 50, className = "" }: { text: string, delay?: number, className?: string }) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(intervalId)
      }
    }, delay)

    return () => clearInterval(intervalId)
  }, [text, delay])

  return (
    <span className={`${className} inline-block`}>
      {displayedText}
      {displayedText.length < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}

export default function NotFound() {
  const [countdown, setCountdown] = useState(10)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Delay showing content to sync with logo animation
    setTimeout(() => setShowContent(true), 500)

    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const newCount = 10 - elapsedSeconds

      if (newCount <= 0) {
        clearInterval(timer)
        window.location.href = '/'
      } else {
        setCountdown(newCount)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col justify-between px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Top section */}
      <div className="text-center pt-16 z-10">
        {showContent && (
          <>
            <h1 className="text-7xl font-extrabold text-white mb-2">
              <TypewriterText text="404" delay={100} />
            </h1>
            <h2 className="text-4xl font-bold text-white">
              <TypewriterText text="Page Not Found" delay={75} />
            </h2>
          </>
        )}
      </div>

      {/* Center section with animation */}
      <div className="flex-1 flex items-center justify-center relative z-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="transform scale-[3]">
            <div className="relative z-20 overflow-visible">
              <MainLogoAnimated />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="text-center pb-16 z-10">
        {showContent && (
          <div className="space-y-6">
            <p className="text-2xl text-white">
              <TypewriterText 
                text="Oops! The page you're looking for doesn't exist."
                delay={50}
              />
            </p>

            <div className="space-y-3">
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Home className="mr-2" />
                <TypewriterText text="Go to Homepage" delay={50} />
              </Link>
              <p className="text-white text-xl">
                <TypewriterText 
                  text={`Redirecting in ${countdown} seconds...`}
                  key={countdown}
                  delay={25}
                />
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}