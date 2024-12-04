'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ErrorPageProps {
  code: number;
  message: string;
  redirectPath?: string;
  countdown?: number;
}

export default function ErrorPage({ 
  code, 
  message, 
  redirectPath = '/',
  countdown = 10 
}: ErrorPageProps) {
  const [timeLeft, setTimeLeft] = useState(countdown)
  const [showContent, setShowContent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Delay showing content for animation
    setTimeout(() => setShowContent(true), 500)

    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const newCount = countdown - elapsedSeconds

      if (newCount <= 0) {
        clearInterval(timer)
        router.push(redirectPath)
      } else {
        setTimeLeft(newCount)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown, redirectPath, router])

  return (
    <div className="h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col justify-center items-center">
      {showContent && (
        <>
          <h1 className="text-7xl font-bold text-white mb-4">{code}</h1>
          <p className="text-2xl text-white mb-8">{message}</p>
          <button 
            onClick={() => router.push(redirectPath)}
            className="px-6 py-3 bg-white rounded-md"
          >
            Return Home
          </button>
          <p className="text-white mt-4">
            Redirecting in {timeLeft} seconds...
          </p>
        </>
      )}
    </div>
  )
}