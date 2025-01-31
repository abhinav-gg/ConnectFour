'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'
import { Home, LogIn, BarChart2, PlayCircle, Info, Book, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Image from 'next/image'

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    handleResize();

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
        <div className="relative w-64 bg-gradient-to-b from-blue-700 to-blue-800 p-6 flex flex-col shadow-lg min-h-screen">
          <div className="flex flex-col items-center mb-8 relative">
            <div className="mb-4">
              <button 
                onClick={toggleDashboard} 
                className="absolute p-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"
                aria-label="Close Dashboard"
                style={{ width: '2rem', height: '2rem' }}
              >
                <ChevronLeft className="h-5 w-5" />
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
            <h2 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h2>
          </div>
          
          <div className="space-y-4">
            <Link href="/" className="flex items-center text-gray-200 hover:text-white hover:bg-blue-600 p-3 rounded-lg transition-colors shadow hover:shadow-md">
              <Home className="mr-2" />
              Home
            </Link>
            
            <Link href="/game" className="flex items-center text-gray-200 hover:text-white hover:bg-blue-600 p-3 rounded-lg transition-colors shadow hover:shadow-md">
              <PlayCircle className="mr-2" />
              Game
            </Link>

            <Link href="/events" className="flex items-center text-gray-200 hover:text-white hover:bg-blue-600 p-3 rounded-lg transition-colors shadow hover:shadow-md">
              <Calendar className="mr-2" />
              Events
            </Link>

            <Link href="/analysis" className="flex items-center text-gray-200 hover:text-white hover:bg-blue-600 p-3 rounded-lg transition-colors shadow hover:shadow-md">
              <BarChart2 className="mr-2" />
              Analysis
            </Link>

            <Link href="/openings" className="flex items-center text-gray-200 hover:text-white hover:bg-blue-600 p-3 rounded-lg transition-colors shadow hover:shadow-md">
              <Book className="mr-2" />
              Opening Book
            </Link>
            
            <Link href="/about-us" className="flex items-center text-gray-200 hover:text-white hover:bg-blue-600 p-3 rounded-lg transition-colors shadow hover:shadow-md">
              <Info className="mr-2" />
              About
            </Link>
            
            <Link href="/login" className="flex items-center text-gray-200 hover:text-white hover:bg-blue-600 p-3 rounded-lg transition-colors shadow hover:shadow-md">
              <LogIn className="mr-2" />
              Login
            </Link>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button 
          onClick={toggleDashboard} 
          className="absolute top-4 left-4 p-2 bg-blue-700 text-white rounded-full hover:bg-blue-600 z-10 transition-colors shadow hover:shadow-md"
          aria-label="Open Dashboard"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
