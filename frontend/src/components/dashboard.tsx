'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'
import { Home, LogIn, BarChart2, PlayCircle, Info, Book, ChevronLeft, ChevronRight, LogOut, UserCircle } from 'lucide-react'
import Image from 'next/image'

interface TestProps {
  closed?: boolean
}

export default function Dashboard(props: TestProps) {
  const [isOpen, setIsOpen] = useState(true);

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
  }, []);

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
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
              <Home className="mr-2" />
              Home
            </Link>
            
            <Link href="/game" className="flex items-center text-gray-600 hover:text-gray-800">
              <PlayCircle className="mr-2" />
              Game
            </Link>
            
            <Link href="/analysis" className="flex items-center text-gray-600 hover:text-gray-800">
              <BarChart2 className="mr-2" />
              Analysis
            </Link>

            <Link href="/openings" className="flex items-center text-gray-600 hover:text-gray-800">
              <Book className="mr-2" />
              Opening Book
            </Link>
            
            <Link href="/about-us" className="flex items-center text-gray-600 hover:text-gray-800">
              <Info className="mr-2" />
              About
            </Link>
            
            <Link href="/login" className="flex items-center text-gray-600 hover:text-gray-800">
              <LogIn className="mr-2" />
              Login
            </Link>
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
