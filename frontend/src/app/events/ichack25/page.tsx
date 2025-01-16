'use client'
// TODO: update the dashboard to be the new one when on this page and add the ichack 2025 logo
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSpring, animated, config } from '@react-spring/web'
import { Home, LogIn } from 'lucide-react'
import IchackLogo from '@/components/ichacklogo'
import Image from 'next/image'

const eventDate = new Date('2025-02-02T00:00:00')

const calculateTimeLeft = (eventDate: Date) => {
  const difference = +eventDate - +new Date();
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
}

export default function ICHack25() {
  const [registered, setRegistered] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(eventDate));

  // Define animations
  const titleAnimation = useSpring({
    from: { opacity: 0, y: -50 },
    to: { opacity: 1, y: 0 },
    config: config.gentle
  })

  const logoAnimation = useSpring({
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    delay: 200,
    config: config.gentle
  })

  const formAnimation = useSpring({
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0 },
    delay: 400,
    config: config.gentle
  })

  const registeredAnimation = useSpring({
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: registered ? 1 : 0, scale: registered ? 1 : 0.9 },
    config: config.gentle
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(eventDate));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const renderCountdown = () => (
    <div className="bg-black p-8 rounded-lg">
      <div className="flex justify-center space-x-4">
        {[
          <div key="days" className="bg-blue-500 w-1/3 rounded-lg p-4 flex items-center justify-center">
            <div className="flex items-end">
              <div className="text-6xl font-bold text-white">{timeLeft.days}</div>
              <div className="text-sm text-white ml-2 mb-2">Days</div>
            </div>
          </div>,
          <div key="hours" className="bg-red-500 w-1/3 rounded-lg p-4 flex items-center justify-center">
            <div className="flex items-end">
              <div className="text-6xl font-bold text-white">{timeLeft.hours}</div>
              <div className="text-sm text-white ml-2 mb-2">Hours</div>
            </div>
          </div>,
          <div key="minutes-seconds" className="w-1/3 flex flex-col space-y-2">
            <div className="bg-yellow-500 rounded-lg p-2 text-white h-1/2 flex items-center justify-center">
              <div className="flex items-end">
                <div className="text-4xl font-bold">{timeLeft.minutes}</div>
                <div className="text-sm ml-2 mb-1">Minutes</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-2 text-black h-1/2 flex items-center justify-center">
              <div className="flex items-end">
                <div className="text-4xl font-bold">{timeLeft.seconds}</div>
                <div className="text-sm ml-2 mb-1">Seconds</div>
              </div>
            </div>
          </div>
        ]}
      </div>
    </div>
  );

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
            <animated.h1
              style={titleAnimation}
              className="text-6xl font-bold text-center mb-4"
            >
              ICHack25
            </animated.h1>

            <animated.h2
              style={titleAnimation}
              className="text-2xl text-center mb-8 text-gray-700"
            >
              The largest student-run hackathon in Europe
            </animated.h2>

            <animated.div
              style={logoAnimation}
              className="flex justify-center mb-8"
            >
              <IchackLogo />
            </animated.div>

            <animated.div
              style={logoAnimation}
              className="text-center mb-12"
            >
              {isClient ? renderCountdown() : <div>Loading...</div>}
            </animated.div>

            <animated.div
              style={formAnimation}
              className="mb-12"
            >
              <div className="flex items-center justify-center space-x-4">
                <div className="flex flex-col space-y-4">
                  {[0, 1, 2].map((i) => (
                    <Image 
                      key={i}
                      src="/duck.png"
                      alt="Duck"
                      width={32}
                      height={32}
                      priority
                      unoptimized
                    />
                  ))}
                </div>

                <div className="bg-white bg-opacity-90 rounded-lg shadow-md max-w-3xl mx-auto border-2 border-[#0A4C8B]">
                  <div className="flex items-center bg-gradient-to-r from-[#2A5AA7] to-[#5B9BD5] px-2 py-1">
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">about.txt - Notepad</div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-black bg-[#E8E8E8] hover:bg-[#D5D5D5] px-3 py-0.5 text-sm font-bold rounded-sm">_</button>
                      <button className="text-black bg-[#E8E8E8] hover:bg-[#D5D5D5] px-3 py-0.5 text-sm font-bold rounded-sm">□</button>
                      <button className="text-black bg-[#E8E8E8] hover:bg-[#D5D5D5] px-3 py-0.5 text-sm font-bold rounded-sm">×</button>
                    </div>
                  </div>
                  <div className="flex items-center text-sm border-b border-gray-300">
                    <div className="px-2 py-1 hover:bg-[#E8E8E8] cursor-pointer">File</div>
                    <div className="px-2 py-1 hover:bg-[#E8E8E8] cursor-pointer">Edit</div>
                    <div className="px-2 py-1 hover:bg-[#E8E8E8] cursor-pointer">Format</div>
                    <div className="px-2 py-1 hover:bg-[#E8E8E8] cursor-pointer">View</div>
                    <div className="px-2 py-1 hover:bg-[#E8E8E8] cursor-pointer">Help</div>
                  </div>
                  <div className="p-4 font-mono text-sm text-gray-800 whitespace-pre-line bg-white">
                    {`IC Hack is an annual hackathon held at Imperial's South Kensington campus. It is the biggest student-run hackathon in Europe.

Running for the 13th year, they're bringing over 700 of the UK's most creative and talented students together for 24 hours of learning, building, fun, and networking.

IC Hack covers food and swag for all hackers, not to mention the opportunity to win some incredible prizes from their sponsors!`}
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  {[0, 1, 2].map((i) => (
                    <Image 
                      key={i}
                      src="/duck.png"
                      alt="Duck"
                      width={32}
                      height={32}
                      className="scale-x-[-1]"
                      priority
                      unoptimized
                    />
                  ))}
                </div>
              </div>
            </animated.div>

            <animated.form
              style={formAnimation}
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
            </animated.form>

            {registered && (
              <animated.div
                style={registeredAnimation}
                className="bg-green-500 bg-opacity-20 rounded-lg p-8 mb-12 text-center"
              >
                <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
                <p>Your registration for ICHack25 has been received. We can't wait to see you there!</p>
              </animated.div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}