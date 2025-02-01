'use client'

import { useState, useEffect } from 'react';
import { Home, LogIn, BarChart2, PlayCircle, Info, Book, 
  LogOut, ChevronLeft, ChevronRight, Calendar, Trophy } from 'lucide-react'
import Image from 'next/image'

interface TestProps {
  closed?: boolean
}

// Centralized dashboard items configuration
const DASHBOARD_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/game', label: 'Game', icon: PlayCircle },
  { path: '/events', label: 'Events', icon: Calendar },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/analysis', label: 'Analysis', icon: BarChart2 },
  { path: '/openings', label: 'Opening Book', icon: Book },
  { path: '/about-us', label: 'About', icon: Info },
  { path: '/login', label: 'Login', icon: LogIn },
  { path: '/logout', label: 'Logout', icon: LogOut },
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
        <div className="relative w-64 bg-gradient-to-b p-6 flex flex-col shadow-lg min-h-screen">
          <div className="flex flex-col items-center mb-8 relative">
            <div className="mb-4">
              <button 
                onClick={toggleDashboard} 
                className="absolute p-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"
                aria-label="Close Dashboard"
                style={{ width: '2.5rem', height: '2.5rem' }}
              >
                <ChevronLeft className="h-5 w-5 text-white mx-auto" style={{ margin: 'auto' }} />
              </button>
            </div>
            <div className="bg-white p-2 rounded-full mb-4 shadow-md">
              <Image 
                src="/logo.png" 
                alt="Logo"
                width={100} 
                height={100}
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Dashboard</h2>
          </div>
          
          <div className="space-y-4">
            {DASHBOARD_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  onClick={() => { window.location.href = item.path; }}
                  className={`
                    flex items-center transform scale-100 hover:scale-105 cursor-pointer
                    ${visibleRows.includes(index) ? 'animate-slide-in opacity-100' : 'opacity-0 translate-x-[-50px]'}
                    transition-all duration-500 ease-out
                  `}
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <Icon className="mr-2" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button 
          onClick={toggleDashboard} 
          className="absolute top-4 left-4 p-2 bg-blue-700 rounded-full hover:bg-blue-600 z-10 transition-colors shadow hover:shadow-md flex items-center justify-center"
          aria-label="Open Dashboard"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      )}
    </div>
  )
}
