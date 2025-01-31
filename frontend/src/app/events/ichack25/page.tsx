'use client';
// TODO: update the dashboard to be the new one when on this page and add the ichack 2025 logo
import Dashboard from '@/components/dashboard';
import IchackLogo from '@/components/ichacklogo';
import { animated, config, useSpring } from '@react-spring/web';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getConfig } from '@/config/env';
import Confetti from 'react-confetti';
import IchackBanner from '@/components/ichackbanner';
import duck from "@/assets/duck.svg";
import { useCallback } from 'react';

// temporarily set the data to 10 seconds from now for testing
const eventDate = new Date(new Date().getTime() + 10000);
//new Date('2025-02-01T09:00:00');
const endDate = new Date('2025-02-02T11:00:00');

const calculateTimeLeft = (time: Date) => {
  const difference = +time - +new Date();
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    finished: difference <= 0
  };
};

export default function ICHack25() {
  const [registered, setRegistered] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(eventDate));
  const [hasStarted, setHasStarted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isConfettiComplete, setIsConfettiComplete] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'not-ichack') {
      setShowError(true);
    }
  }, []);

  // Define animations
  const titleAnimation = useSpring({
    from: { opacity: 0, y: -50 },
    to: { opacity: 1, y: 0 },
    config: config.gentle
  });

  const logoAnimation = useSpring({
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    delay: 200,
    config: config.gentle
  });

  const formAnimation = useSpring({
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0 },
    delay: 400,
    config: config.gentle
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const hasStarted = (new Date() >= eventDate);
      const tl = calculateTimeLeft(eventDate);
      if (tl.finished) {
        setTimeLeft(calculateTimeLeft(endDate));
        if (!isConfettiComplete) {
          setShowConfetti(true);
          setIsConfettiComplete(true);
        }
      } else {
        setTimeLeft(tl);
      }
      setHasStarted(hasStarted);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const renderCountdown = () => (
    <div className="bg-black p-8 rounded-lg">
      <div className="flex justify-center space-x-4">
        {hasStarted ?
          [
            <div key="days" className="bg-blue-500 w-1/3 rounded-lg p-6 flex items-center justify-center">
              <Link href="https://discord.com/oauth2/authorize?client_id=1334635525985796136&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fevents%2Fichack25%2Fdiscord&scope=identify" className="w-full h-full text-white font-bold hover:scale-105 transition-transform">Join Event</Link>
            </div>,
            <div key="hours" className="bg-red-500 w-1/3 rounded-lg p-6 flex items-center justify-center">
              <Link href="/login" className="w-full h-full text-white font-bold hover:scale-105 transition-transform">Create Game</Link>
            </div>,
            <div key="minutes-seconds" className="w-1/3 flex flex-col space-y-2">
              <div className="bg-yellow-500 rounded-lg p-4 text-white h-1/2 flex items-center justify-center">
                <Link href="/events/ichack/leaderboard" className="w-full h-full text-white font-bold hover:scale-105 transition-transform">Leaderboard</Link>
              </div>
              <div className="bg-white rounded-lg p-4 text-black h-1/2 flex items-center justify-center">
                <Link href="https://ichack.org" className="w-full h-full text-black font-bold hover:scale-105 transition-transform">ICHack</Link>
              </div>
            </div>] : [
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

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 text-gray-800">
      {showError && (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white p-4 text-center z-50">
          Failed to verify Discord account
        </div>
      )}
      {showConfetti && (
        <Confetti
          numberOfPieces={500}
          recycle={false}
          run={showConfetti}
          onConfettiComplete={handleConfettiComplete}
        />
      )}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='anonymous' />
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Jost:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      <div className="flex font-ichack">
        <Dashboard />

        <main className="flex-1 px-4 py-8">
          <IchackBanner />
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
              <br /><br />
              {hasStarted && <div className="w-full flex space-x-4 justify-center">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-4 flex items-center justify-center shadow-lg">
                  <div className="flex items-end">
                    <div className="text-6xl font-bold text-white">{timeLeft.hours}</div>
                    <div className="text-sm text-white ml-2 mb-2">Hours</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-red-500 rounded-lg p-4 flex items-center justify-center shadow-lg">
                  <div className="flex items-end">
                    <div className="text-6xl font-bold text-white">{timeLeft.minutes}</div>
                    <div className="text-sm text-white ml-2 mb-2">Minutes</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg p-4 flex items-center justify-center shadow-lg">
                  <div className="flex items-end">
                    <div className="text-6xl font-bold text-white">{timeLeft.seconds}</div>
                    <div className="text-sm text-white ml-2 mb-2">Seconds</div>
                  </div>
                </div>
              </div>}
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
                      src={duck.src}
                      alt="Duck"
                      width={32}
                      height={32}
                      priority
                    />
                  ))}
                </div>

                <div className="bg-white bg-opacity-90 rounded-lg shadow-md max-w-3xl mx-auto border-2 border-[#0A4C8B] font-inter">
                  <div className="flex items-center bg-gradient-to-r from-[#2A5AA7] to-[#5B9BD5] px-2 py-1">
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">about.txt - Notepad</div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-black bg-[#ffffff] hover:bg-[#E5E5E5] px-3 py-0.5 text-sm font-bold rounded-sm">–</button>
                      <button className="text-black bg-[#ffffff] hover:bg-[#E5E5E5] px-3 py-0.5 text-sm font-bold rounded-sm">□</button>
                      <button className="text-black bg-[#ffffff] hover:bg-[#E81123] hover:text-white px-3 py-0.5 text-sm font-bold rounded-sm">×</button>
                    </div>
                  </div>
                  <div className="flex items-center text-sm border-b-2 border-b-[#f0f0f0]">
                    <div className="px-2 py-0.5 hover:bg-[#E5F3FF] border border-transparent hover:border-[#CCE8FF] cursor-pointer">File</div>
                    <div className="px-2 py-0.5 hover:bg-[#E5F3FF] border border-transparent hover:border-[#CCE8FF] cursor-pointer">Edit</div>
                    <div className="px-2 py-0.5 hover:bg-[#E5F3FF] border border-transparent hover:border-[#CCE8FF] cursor-pointer">Format</div>
                    <div className="px-2 py-0.5 hover:bg-[#E5F3FF] border border-transparent hover:border-[#CCE8FF] cursor-pointer">View</div>
                    <div className="px-2 py-0.5 hover:bg-[#E5F3FF] border border-transparent hover:border-[#CCE8FF] cursor-pointer">Help</div>
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
                      src={duck.src}
                      alt="Duck"
                      width={32}
                      height={32}
                      className="scale-x-[-1]"
                      priority
                    />
                  ))}
                </div>
              </div>
            </animated.div>

            <animated.form
              style={formAnimation}
              onSubmit={(e) => {
                e.preventDefault();
                setRegistered(true);
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
          </div>
        </main>
      </div>
    </div>
  );
}