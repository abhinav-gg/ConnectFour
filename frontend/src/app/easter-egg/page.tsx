'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react'


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
  

const EasterEggPage = () => {
  const [text, setText] = useState('');
  const [countdown, setCountdown] = useState(10);
  const fullText = "This product was inspired by RT and our countless games of connect four in college. I promised I'd make this tool for us back then and I'm sorry it took so long but hope you like it now!";

  useEffect(() => {
    // Typewriter effect
    let index = 0;
    const typeWriter = setInterval(() => {
      if (index < fullText.length) {
        setText((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(typeWriter);
      }
    }, 40); // Adjust typing speed here

    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          window.location.href = '/'; // Redirect to the main page
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // Countdown every second

    return () => {
      clearInterval(typeWriter);
      clearInterval(countdownTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold pr-4 pl-4 text-center" style={{ fontFamily: 'Lobster, cursive' }}>
        {text}
      </h1>
      <div className="space-y-3">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Home className="mr-2" />
              <TypewriterText text="Go to Homepage" delay={50} />
            </Link>
            <br/>
            <p className="text-white text-xl">
              <TypewriterText 
                text={`Redirecting in ${countdown} seconds...`}
                key={countdown}
                delay={25}
              />
            </p>
        </div>
    </div>
  );
};

export default EasterEggPage;