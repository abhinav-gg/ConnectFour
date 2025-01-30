'use client';

import { useState, useEffect } from 'react';
import LeaderboardLayout from '@/components/leaderboard';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function Leaderboard() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  const topPlayersDemo = [
    { rank: 1, name: "Player One", score: 1500 },
    { rank: 2, name: "Player Two", score: 1450 },
    { rank: 3, name: "Player Three", score: 1400 },
    { rank: 4, name: "Player Four", score: 1350 },
    { rank: 5, name: "Player Five", score: 1300 },
    { rank: 6, name: "Player Six", score: 1150 },
  ];

  return (
    <LeaderboardLayout darkMode={darkMode} players={topPlayersDemo}>
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        aria-label="Toggle theme"
      >
        {darkMode ? <FaSun className="text-white" /> : <FaMoon />}
      </button>
      {/* Add your leaderboard content here */}
    </LeaderboardLayout>
  );
}