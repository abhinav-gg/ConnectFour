'use client'

import Dashboard from '@/components/dashboard'
import { useState, useEffect } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'

export default function Leaderboard() {
  const [darkMode, setDarkMode] = useState(false)

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Toggle theme
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('darkMode', (!darkMode).toString())
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-black' : 'bg-white'}`}>
      <Dashboard/>
      <div className="flex-1 p-8 relative">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <FaMoon size={20} color={darkMode ? "#fcd34d" : "#1f2937"} />
          ) : (
            <FaSun size={20} color="#f59e0b" />
          )}
        </button>

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Leaderboard</h1>
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-md rounded-lg p-4`}>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Rank</th>
                <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Player</th>
                <th className={`px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-t dark:border-gray-700 px-4 py-2 text-center text-yellow-500 font-bold">1</td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Player One</td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>1500</td>
              </tr>
              <tr>
                <td className="border-t dark:border-gray-700 px-4 py-2 text-center text-gray-400 font-bold">2</td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Player Two</td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>1450</td>
              </tr>
              <tr>
                <td className="border-t dark:border-gray-700 px-4 py-2 text-center text-amber-700 font-bold">3</td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Player Three</td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>1400</td>
              </tr>
              <tr>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>4</td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>Player Four</td>
                <td className={`border-t dark:border-gray-700 px-4 py-2 text-center ${darkMode ? 'text-white' : 'text-black'}`}>1350</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}