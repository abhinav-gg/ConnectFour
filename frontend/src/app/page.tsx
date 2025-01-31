'use client';

import { useEffect, useState } from 'react';
import MainLogoAnimated from '@/components/mainlogo_animated';
import Dashboard from '@/components/dashboard';
import LoadingAnimation from '@/components/LoadingAnimation';

export default function Home() {
  const text = "Made by Abhinav and Friends";
  const [showText, setShowText] = useState(false);
  const [opacities, setOpacities] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setShowText(true);
      setOpacities(new Array(text.length).fill(0));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showText) {
      text.split('').forEach((_, index) => {
        const duration = 2000;
        const staggerDelay = 200;
        const steps = 20;
        const stepTime = duration / steps;

        for (let step = 1; step <= steps; step++) {
          setTimeout(() => {
            setOpacities(prev => {
              const newOpacities = [...prev];
              newOpacities[index] = step / steps;
              return newOpacities;
            });
          }, index * staggerDelay + step * stepTime);
        }
      });
    }
  }, [showText]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 flex">
      <Dashboard />
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex justify-center items-center">
            <div className="w-1/2 h-1/2">
              <MainLogoAnimated />
            </div>
          </div>
        </div>
        <div 
          className="absolute inset-x-0 bottom-12 text-center font-bold text-white text-lg z-50"
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