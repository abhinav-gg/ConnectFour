'use client'
// TODO: update the dashboard to be the new one when on this page and add the ichack 2025 logo
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSpring, animated, config } from '@react-spring/web'
import { Home, LogIn } from 'lucide-react'
import IchackLogo from '@/components/ichacklogo'

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
          { label: 'Days', value: timeLeft.days, bgColor: 'bg-blue-500', width: 'w-1/3' },
          { label: 'Hours', value: timeLeft.hours, bgColor: 'bg-red-500', width: 'w-1/3' },
          <div className="w-1/3 flex flex-col space-y-2">
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
        ].map((item, index) => {
          if (index < 2) {
            return (
              <div 
                key={item.label} 
                className={`${item.bgColor} ${item.width} rounded-lg p-4 flex items-center justify-center`}
              >
                <div className="flex items-end">
                  <div className="text-6xl font-bold text-white">{item.value}</div>
                  <div className="text-sm text-white ml-2 mb-2">{item.label}</div>
                </div>
              </div>
            );
          }
          return item;
        })}
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