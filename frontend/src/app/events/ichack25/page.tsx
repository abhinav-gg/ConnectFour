'use client';
// TODO: update the dashboard to be the new one when on this page and add the ichack 2025 logo
import Dashboard from '@/components/dashboard';
import IchackLogo from '@/components/ichacklogo';
import { animated, config, useSpring } from '@react-spring/web';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { getConfig } from '@/config/env';
import Confetti from 'react-confetti';
import IchackBanner from '@/components/ichackbanner';
import duck from "@/assets/duck.svg";
import { useCallback } from 'react';
import Loading from '@/components/loading';

// temporarily set the data to 10 seconds from now for testing
const eventDate = new Date('2025-02-01T16:00:00');
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
  const [updateCount, setUpdateCount] = useState(0);
  const displayedTextRef = useRef<string>(''); // Use ref to persist text

  const REDIRECT_URI = getConfig().discordRedirectUri;

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
    const text = "To participate in this event, you must be a member of ICHack25! You must also register a free account with con4.uk so we can keep track of your progress and link you to your ICHack discord account! Good Luck and have fun <3"
        
    if (displayedTextRef.current.length !== 0) return; // Skip if text is already displayed
    const intervalId = setInterval(() => {
      let currentIndex = displayedTextRef.current.length; // Start at the current length of the displayed text
      if (currentIndex < text.length) {
        displayedTextRef.current += text[currentIndex]; // Append character
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 30); // Adjust speed here (lower = faster)
    return () => clearInterval(intervalId);
  }, []); // Only run effect once at the beginning


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const hasStarted = (new Date() >= eventDate);
      const tl = calculateTimeLeft(eventDate);
      if (tl.finished) {
        setTimeLeft(calculateTimeLeft(endDate));
        if (!isConfettiComplete && !showConfetti) {
          setShowConfetti(true);
          setIsConfettiComplete(true);
        }
      } else {
        setTimeLeft(tl);
      }
      setHasStarted(hasStarted);
    }, 100);

    return () => clearInterval(timer);
  }, [showConfetti, isConfettiComplete]);

  const RenderDisclaimer = () => {
    return <animated.div className="bg-white p-4 rounded-lg shadow-md mb-8" style={formAnimation}>
    <h3 className="text-mid font-bold">Disclaimer</h3>
    <p className="text-gray-700 text-sm">
      <span>{displayedTextRef.current}</span>
    </p>
  </animated.div>; // Display the current text
  };

  const renderCountdown = () => (
    <div className="bg-black p-4 sm:p-8 rounded-lg max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
        {hasStarted ?
          [
            <div key="days" className="bg-blue-500 w-full sm:w-1/3 rounded-lg p-3 sm:p-6 flex items-center justify-center">
              <Link href={`https://discord.com/oauth2/authorize?client_id=1334635525985796136&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`} 
                className="w-full text-center text-white font-bold hover:scale-105 transition-transform text-sm sm:text-base">
                Join Event
              </Link>
            </div>,
            <div key="hours" className="bg-red-500 w-full sm:w-1/3 rounded-lg p-3 sm:p-6 flex items-center justify-center">
              <Link href="/game" className="w-full text-center text-white font-bold hover:scale-105 transition-transform text-sm sm:text-base">
                Create Game
              </Link>
            </div>,
            <div key="minutes-seconds" className="w-full sm:w-1/3 flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
              <div className="bg-yellow-500 rounded-lg p-2 sm:p-4 text-white flex-1 flex items-center justify-center">
                <Link href="/events/ichack25/leaderboard" className="w-full text-center text-white font-bold hover:scale-105 transition-transform text-sm sm:text-base">
                  Leaderboard
                </Link>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-4 text-black flex-1 flex items-center justify-center">
                <Link href="https://ichack.org" className="w-full text-center text-black font-bold hover:scale-105 transition-transform text-sm sm:text-base">
                  ICHack
                </Link>
              </div>
            </div>
          ] : [
            <div key="days" className="bg-blue-500 w-full sm:w-1/3 rounded-lg p-2 sm:p-4 flex items-center justify-center">
              <div className="flex items-end">
                <div className="text-3xl sm:text-6xl font-bold text-white">{timeLeft.days}</div>
                <div className="text-xs sm:text-sm text-white ml-1 sm:ml-2 mb-1 sm:mb-2">Days</div>
              </div>
            </div>,
            <div key="hours" className="bg-red-500 w-full sm:w-1/3 rounded-lg p-2 sm:p-4 flex items-center justify-center">
              <div className="flex items-end">
                <div className="text-3xl sm:text-6xl font-bold text-white">{timeLeft.hours}</div>
                <div className="text-xs sm:text-sm text-white ml-1 sm:ml-2 mb-1 sm:mb-2">Hours</div>
              </div>
            </div>,
            <div key="minutes-seconds" className="w-full sm:w-1/3 flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
              <div className="bg-yellow-500 rounded-lg p-1 sm:p-2 text-white flex-1 flex items-center justify-center">
                <div className="flex items-end">
                  <div className="text-2xl sm:text-4xl font-bold">{timeLeft.minutes}</div>
                  <div className="text-xs sm:text-sm ml-1 sm:ml-2 mb-0.5 sm:mb-1">Min</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-1 sm:p-2 text-black flex-1 flex items-center justify-center">
                <div className="flex items-end">
                  <div className="text-2xl sm:text-4xl font-bold">{timeLeft.seconds}</div>
                  <div className="text-xs sm:text-sm ml-1 sm:ml-2 mb-0.5 sm:mb-1">Sec</div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 text-gray-800 overflow-hidden">
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
          width={window.innerWidth - 20}
          height={window.innerHeight}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100 }}
        />
      )}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='anonymous' />
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Jost:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      <div className="flex flex-col md:flex-row font-ichack min-h-screen">
        <Dashboard />

        <main className="flex-1 px-2 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <IchackBanner />
          <div className="container mx-auto max-w-4xl">
            <animated.h1
              style={titleAnimation}
              className="text-3xl sm:text-4xl md:text-6xl font-bold text-center mb-2 sm:mb-4"
            >
              ICHack25
            </animated.h1>

            <animated.h2
              style={titleAnimation}
              className="text-lg sm:text-xl md:text-2xl text-center mb-4 sm:mb-8 text-gray-700 px-2"
            >
              The largest student-run hackathon in Europe
            </animated.h2>

            <animated.div
              style={logoAnimation}
              className="flex justify-center mb-4 sm:mb-8 transform scale-75 sm:scale-90 md:scale-100"
            >
              <IchackLogo />
            </animated.div>

            <animated.div
              style={logoAnimation}
              className="text-center mb-12"
            >
              {isClient ? (
                <>
                  <RenderDisclaimer key={updateCount} />
                  {renderCountdown()}
                </>
              ) : <Loading />}
              <br /><br />
              {hasStarted && <div className="w-full flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 justify-center px-2">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-2 sm:p-4 flex items-center justify-center shadow-lg">
                  <div className="flex items-end">
                    <div className="text-2xl sm:text-4xl md:text-6xl font-bold text-white">{timeLeft.hours}</div>
                    <div className="text-xs sm:text-sm text-white ml-1 sm:ml-2 mb-1 sm:mb-2">Hours</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-red-500 rounded-lg p-2 sm:p-4 flex items-center justify-center shadow-lg">
                  <div className="flex items-end">
                    <div className="text-2xl sm:text-4xl md:text-6xl font-bold text-white">{timeLeft.minutes}</div>
                    <div className="text-xs sm:text-sm text-white ml-1 sm:ml-2 mb-1 sm:mb-2">Minutes</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg p-2 sm:p-4 flex items-center justify-center shadow-lg">
                  <div className="flex items-end">
                    <div className="text-2xl sm:text-4xl md:text-6xl font-bold text-white">{timeLeft.seconds}</div>
                    <div className="text-xs sm:text-sm text-white ml-1 sm:ml-2 mb-1 sm:mb-2">Seconds</div>
                  </div>
                </div>
              </div>}
            </animated.div>

            <animated.div
              style={formAnimation}
              className="mb-8 sm:mb-12 px-2"
            >
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="hidden md:flex flex-col space-y-4">
                  {[0, 1, 2].map((i) => (
                    <Image key={i} src={duck.src} alt="Duck" width={24} height={24} className="transform scale-75 sm:scale-100" priority />
                  ))}
                </div>

                <div className="bg-white bg-opacity-90 rounded-lg shadow-md w-full max-w-3xl mx-auto border-2 border-[#0A4C8B] font-inter">
                  <div className="flex items-center bg-gradient-to-r from-[#2A5AA7] to-[#5B9BD5] px-2 py-1">
                    <div className="flex-1">
                      <div className="text-white font-bold text-xs sm:text-sm">about.txt - Notepad</div>
                    </div>
                    <div className="flex space-x-1 sm:space-x-2">
                      <button className="text-black bg-[#ffffff] hover:bg-[#E5E5E5] px-2 sm:px-3 py-0.5 text-xs sm:text-sm font-bold rounded-sm">–</button>
                      <button className="text-black bg-[#ffffff] hover:bg-[#E5E5E5] px-2 sm:px-3 py-0.5 text-xs sm:text-sm font-bold rounded-sm">□</button>
                      <button className="text-black bg-[#ffffff] hover:bg-[#E81123] hover:text-white px-2 sm:px-3 py-0.5 text-xs sm:text-sm font-bold rounded-sm">×</button>
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

Running for the 1st year, we're bringing the same energy through our hackspace challenge! The top three of each of our time controls will win prizes, and the top three overall will earn some hackspace points to get them closer to custom prizes!`}
                  </div>
                </div>

                <div className="hidden md:flex flex-col space-y-4">
                  {[0, 1, 2].map((i) => (
                    <Image key={i} src={duck.src} alt="Duck" width={24} height={24} className="transform scale-75 sm:scale-100 scale-x-[-1]" priority />
                  ))}
                </div>
              </div>
            </animated.div>
          </div>
        </main>
      </div>
    </div>
  );
}