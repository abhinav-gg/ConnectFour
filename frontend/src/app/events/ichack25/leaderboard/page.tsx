'use client';

import { useState, useEffect, useRef } from 'react';
import LeaderboardLayout from '@/components/leaderboard';
import { FaSun, FaMoon } from 'react-icons/fa';
import type { ICHackLeaderboardPlayer } from "@shared/Models/eventInfo";
import IchackBanner from '@/components/ichackbanner';

export default function Leaderboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState('rapid');

  const players = useRef<ICHackLeaderboardPlayer[]>([
    { rank: 1, username: "player1", elo: 1500, hackspace: "SCR", name: "Player One" },
    { rank: 2, username: "player2", elo: 1450, hackspace: "JCR", name: "Player Two" },
    { rank: 3, username: "player3", elo: 1400, hackspace: "SCR", name: "Player Three" },
    { rank: 4, username: "player4", elo: 1350, hackspace: "QTR", name: "Player Four" },
    { rank: 5, username: "player5", elo: 1300, hackspace: "SCR", name: "Player Five" },
    { rank: 6, username: "player6", elo: 1150, hackspace: "JCR", name: "Player Six" }
  ]);

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

  return (
    <>
      <div className="tabs">
        <button onClick={() => setSelectedTab('rapid')} className={selectedTab === 'rapid' ? 'active' : ''}>Rapid</button>
        <button onClick={() => setSelectedTab('blitz')} className={selectedTab === 'blitz' ? 'active' : ''}>Blitz</button>
        <button onClick={() => setSelectedTab('bullet')} className={selectedTab === 'bullet' ? 'active' : ''}>Bullet</button>
      </div>
      <LeaderboardLayout darkMode={darkMode} players={players.current}>
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {darkMode ? <FaSun className="text-white" /> : <FaMoon />}
        </button>
      </LeaderboardLayout>
    </>
  );
}