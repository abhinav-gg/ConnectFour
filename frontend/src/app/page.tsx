'use client';

import { useEffect, useState, useRef } from 'react';
import MainLogoAnimated from '@/components/mainlogo_animated';
import Dashboard from '@/components/dashboard';

interface DragState {
  velocityX: number;
  velocityY: number;
  isAnimating: boolean;
}

export default function Home() {
  const text = "Made by Abhinav and Friends";
  const [showText, setShowText] = useState(false);
  const [opacities, setOpacities] = useState<number[]>([]);
  const dragRef1 = useRef<HTMLDivElement>(null);
  const dragRef2 = useRef<HTMLDivElement>(null);
  const dragRef3 = useRef<HTMLDivElement>(null);
  const dragStates = useRef<Map<HTMLDivElement, DragState>>(new Map());

  useEffect(() => {
    console.log('Starting text animation timer...');
    const timer = setTimeout(() => {
      console.log('Text animation should start now');
      setShowText(true);
      setOpacities(new Array(text.length).fill(0));
    }, 300);

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

  const animate = (element: HTMLDivElement, dragState: DragState) => {
    if (!dragState.isAnimating) return;

    const rect = element.getBoundingClientRect();
    const transform = new WebKitCSSMatrix(window.getComputedStyle(element).transform);
    let x = transform.m41;
    let y = transform.m42;

    // Apply velocity
    x += dragState.velocityX;
    y += dragState.velocityY;

    // Check for wall collisions
    if (rect.left + dragState.velocityX < 0 || rect.right + dragState.velocityX > window.innerWidth) {
      dragState.velocityX *= -0.8; // Bounce with some energy loss
    }
    if (rect.top + dragState.velocityY < 0 || rect.bottom + dragState.velocityY > window.innerHeight) {
      dragState.velocityY *= -0.8; // Bounce with some energy loss
    }

    // Apply friction
    dragState.velocityX *= 0.98;
    dragState.velocityY *= 0.98;

    // Update position
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    // Stop animation when velocity is very low
    if (Math.abs(dragState.velocityX) < 0.01 && Math.abs(dragState.velocityY) < 0.01) {
      dragState.isAnimating = false;
      return;
    }

    requestAnimationFrame(() => animate(element, dragState));
  };

  const handleDrag = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    e.preventDefault();
    const element = ref.current;
    if (!element) return;

    // Stop any ongoing animation
    const dragState = dragStates.current.get(element) || { velocityX: 0, velocityY: 0, isAnimating: false };
    dragState.isAnimating = false;
    dragStates.current.set(element, dragState);

    // Get the current transform values
    const transform = new WebKitCSSMatrix(window.getComputedStyle(element).transform);
    let startX = e.clientX - transform.m41;
    let startY = e.clientY - transform.m42;
    let lastX = e.clientX;
    let lastY = e.clientY;
    let lastTime = Date.now();

    const onMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      const timeElapsed = currentTime - lastTime;
      
      // Calculate new position
      const x = e.clientX - startX;
      const y = e.clientY - startY;
      
      // Update velocity
      dragState.velocityX = (e.clientX - lastX) / timeElapsed * 16; // Scale to roughly 60fps
      dragState.velocityY = (e.clientY - lastY) / timeElapsed * 16;

      // Update position
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // Update last positions
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = currentTime;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Start animation
      dragState.isAnimating = true;
      animate(element, dragState);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Dashboard 
        closed={true}/>
      <div className="flex-1 relative overflow-hidden">
        {/* Main Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1/2 h-1/2">
            <MainLogoAnimated />
          </div>
        </div>

        {/* Animated Text */}
        <div className="absolute inset-x-0 bottom-12 text-center font-bold text-black text-lg z-10">
          {showText && text.split('').map((char, index) => (
            <span key={index} className="inline-block" style={{ opacity: opacities[index] }}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>

        {/* Draggable Elements */}
        <div 
          ref={dragRef1}
          className="fixed bg-white p-4 rounded-lg shadow-lg cursor-move z-50 select-none"
          style={{ left: '10%', top: '10%', transform: 'translate3d(0, 0, 0)' }}
          onMouseDown={(e) => handleDrag(e, dragRef1)}
        >
          <h2 className="text-lg font-semibold whitespace-nowrap">Welcome to the Game!</h2>
        </div>

        <div 
          ref={dragRef2}
          className="fixed bg-white p-4 rounded-lg shadow-lg cursor-move z-50 select-none"
          style={{ right: '10%', top: '10%', transform: 'translate3d(0, 0, 0)' }}
          onMouseDown={(e) => handleDrag(e, dragRef2)}
        >
          <p className="text-lg whitespace-nowrap">Live Users: 4</p>
          <p className="text-lg whitespace-nowrap">Games Played: 4</p>
        </div>

        <div 
          ref={dragRef3}
          className="fixed bg-white p-4 rounded-lg shadow-lg cursor-move z-50 select-none"
          style={{ left: '10%', bottom: '10%', transform: 'translate3d(0, 0, 0)' }}
          onMouseDown={(e) => handleDrag(e, dragRef3)}
        >
          <p className="text-lg whitespace-nowrap">Contact Us: support@con4.uk</p>
        </div>
      </div>
    </div>
  );
}