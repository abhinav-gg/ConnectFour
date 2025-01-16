'use client'

import Link from 'next/link'
import { Home, LogIn, BarChart2, PlayCircle, Info, Book, Trophy, Calendar } from 'lucide-react'

interface DashboardProps {
  darkMode?: boolean
}

export default function Dashboard({ darkMode }: DashboardProps) {
  return (
    <div className={`w-64 ${darkMode ? 'bg-gray-900' : 'bg-white'} p-4 flex flex-col shadow-md min-h-screen`}>
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Dashboard</h2>
      
      <div className="space-y-6">
        <Link href="/" className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
          <Home className="mr-2" />
          Home
        </Link>
        
        <Link href="/login" className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
          <LogIn className="mr-2" />
          Login
        </Link>
        
        <Link href="/test-analysis" className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
          <BarChart2 className="mr-2" />
          Analysis
        </Link>

        <Link href="/leaderboard" className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
          <Trophy className="mr-2" />
          Leaderboard
        </Link>

        <Link href="/events" className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
          <Calendar className="mr-2" />
          Events
        </Link>

        <Link href="/openings" className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
          <Book className="mr-2" />
          Opening Book
        </Link>
        
        <Link href="/game" className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
          <PlayCircle className="mr-2" />
          Start Game
        </Link>
        
        <Link href="/about-us" className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
          <Info className="mr-2" />
          About
        </Link>
      </div>
    </div>
  )
}
