'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'
import { Home, LogIn, BarChart2, PlayCircle, Info, Book, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface TestProps {
  closed?: boolean
}

// Centralized dashboard items configuration
const DASHBOARD_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/game', label: 'Game', icon: PlayCircle },
  { path: '/analysis', label: 'Analysis', icon: BarChart2 },
  { path: '/openings', label: 'Opening Book', icon: Book },
  { path: '/about-us', label: 'About', icon: Info },
  { path: '/login', label: 'Login', icon: LogIn },
] as const;

export default function Dashboard(props: TestProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [visibleRows, setVisibleRows] = useState<number[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    if (props.closed) {
      setIsOpen(false);
    } else {
      handleResize();
    }

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [props.closed]);

  useEffect(() => {
    // Reset visible rows when dashboard is opened
    if (isOpen) {
      setVisibleRows([]);
      DASHBOARD_ITEMS.forEach((_, index) => {
        setTimeout(() => {
          setVisibleRows((prev) => [...prev, index]);
        }, index * 200); // Slightly faster timing for smoother appearance
      });
    }
  }, [isOpen]);

  const toggleDashboard = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex">
      {isOpen && (
        <div className="relative w-64 bg-white p-4 flex flex-col shadow-md min-h-screen">
          <div className="flex flex-col items-center mb-6 relative">
            <div className="mb-2">
              <button 
                onClick={toggleDashboard} 
                className="absolute p-2 bg-gray-200 items-center rounded hover:bg-gray-300 top-0 right-0"
                aria-label="Close Dashboard"
                style={{ width: '2rem', height: '2rem' }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="scale-100 transform-origin-left">
              <Image 
                src="/logo.png" 
                alt="Logo"
                width={100} 
                height={100}
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h2>
          </div>
          
          <div className="space-y-4">
            {DASHBOARD_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={index}
                  href={item.path}
                  className={`
                    flex items-center text-gray-600 hover:text-gray-800 transform
                    ${visibleRows.includes(index) ? 'animate-slide-in opacity-100' : 'opacity-0 translate-x-[-50px]'}
                    transition-all duration-500 ease-out
                  `}
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <Icon className="mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Reopen button when the dashboard is closed */}
      {!isOpen && (
        <button 
          onClick={toggleDashboard} 
          className="absolute top-4 left-4 p-2 bg-gray-200 rounded hover:bg-gray-300 z-10"
          aria-label="Open Dashboard"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
