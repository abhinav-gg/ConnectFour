'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Countdown from 'react-countdown'
import { Home, LogIn } from 'lucide-react'
import IchackLogo from '@/components/ichacklogo'

const eventDate = new Date('2025-02-02T00:00:00')

export default function ICHack25() {
  const [registered, setRegistered] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 text-gray-800">
      <div className="flex">
        <div className="w-64 bg-white bg-opacity-10 p-4 flex flex-col shadow-md min-h-screen">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
          <Link href="/" className="flex items-center text-gray-800 hover:text-blue-600 mb-2">
            <Home className="mr-2" />
            Home
          </Link>
          <Link href="/login" className="flex items-center text-gray-800 hover:text-blue-600">
            <LogIn className="mr-2" />
            Login
          </Link>
        </div>

        <main className="flex-1 px-4 py-8">
          <div className="container mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-6xl font-bold text-center mb-8"
            >
              ICHack25
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <IchackLogo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-12"
            >
              {isClient ? (
                <Countdown
                  date={eventDate}
                  renderer={({ days, hours, minutes, seconds }) => (
                    <div className="flex justify-center space-x-4">
                      {[
                        { label: 'Days', value: days },
                        { label: 'Hours', value: hours },
                        { label: 'Minutes', value: minutes },
                        { label: 'Seconds', value: seconds },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white bg-opacity-20 rounded-lg p-4">
                          <div className="text-4xl font-bold">{value}</div>
                          <div className="text-sm">{label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                />
              ) : (
                <div>Loading...</div>
              )}
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              onSubmit={(e) => {
                e.preventDefault()
                setRegistered(true)
              }}
              className="bg-white bg-opacity-10 rounded-lg p-8 mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Register Now</h2>
              <input
                type="text"
                placeholder="Name"
                className="w-full bg-white bg-opacity-20 rounded-lg p-2 mb-4"
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-white bg-opacity-20 rounded-lg p-2 mb-4"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Sign Up
              </button>
            </motion.form>

            {registered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500 bg-opacity-20 rounded-lg p-8 mb-12 text-center"
              >
                <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
                <p>Your registration for ICHack25 has been received. We can't wait to see you there!</p>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}