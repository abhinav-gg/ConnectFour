'use client';

import { useEffect, useState } from 'react';
import MainLogoAnimated from '@/components/mainlogo_animated';
import Dashboard from '@/components/dashboard';

export default function Home() {
  const text = "Made by Abhinav and Friends";
  const [showText, setShowText] = useState(false);
  const [opacities, setOpacities] = useState<number[]>([]);

  useEffect(() => {
    console.log('Starting text animation timer...');
    const timer = setTimeout(() => {
      console.log('Text animation should start now');
      setShowText(true);
      // Initialize opacities to 0
      setOpacities(new Array(text.length).fill(0));
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showText) {
      text.split('').forEach((_, index) => {
        // Gradually increase opacity for each character
        const duration = 2000; // 2 seconds for each character fade
        const staggerDelay = 200; // Increased delay between characters
        const steps = 20; // Number of steps for smooth transition
        const stepTime = duration / steps;

        for (let step = 1; step <= steps; step++) {
          setTimeout(() => {
            setOpacities(prev => {
              const newOpacities = [...prev];
              newOpacities[index] = step / steps;
              return newOpacities;
            });
          }, index * staggerDelay + step * stepTime); // More pronounced stagger
        }
      });
    }
  }, [showText]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Dashboard />
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex justify-center items-center">
            <div className="w-3/4 h-3/4">
              <MainLogoAnimated />
            </div>
          </div>
        </div>
        <div 
          className="absolute inset-x-0 bottom-12 text-center font-bold text-black text-lg z-50"
        >
          {showText && text.split('').map((char, index) => (
            <span
              key={index}
              className="inline-block"
              style={{
                opacity: opacities[index]
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}