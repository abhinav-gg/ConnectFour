'use client';
import { useEffect, useState } from 'react';

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
  const fullText = "This project was inspired by our countless games of connect four in school. I said I'd make this tool for all of us back then and I wish it didn't take so long but hope you like it now!";

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
      <h1 className="text-4xl font-bold pr-4 pl-4 text-center mb-4" style={{ fontFamily: 'Lobster, cursive' }}>
        <TypewriterText text={fullText} delay={50} />
      </h1>
      <div className="space-y-3">
        <p className="text-black text-xl">
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