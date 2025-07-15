'use client';

import { useState, useEffect, useRef } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import type { ICHackLeaderboardPlayer } from "@shared/Types/eventInfo";
import LeaderboardLayout from '@/components/events/ichleaderboard';
import { StandardGameModes } from '@shared/constants';
import { GameMode } from '@shared/Types/gameInfo';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/sidebar';
import IchackBanner from '@/components/events/ichackbanner';
import { ICHACK25 } from '@shared/events';
import Loading from '@/components/loading';

export default function Leaderboard() {
  const stdModes = StandardGameModes.standard;
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState(stdModes.rapid);
  const [playersData, setPlayersData] = useState<ICHackLeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const backendUrl = getConfig().backendUrl;

  const getLeaderboard = async (tab: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/events/get-ichack25-leaderboard`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            gamemode: {
              name: tab,
              event: ICHACK25
            } as GameMode
          })
        }
      );
      if (!res.ok) {
        window.location.href = '/login';
        return;
      }   
      const data = await res.json() as ICHackLeaderboardPlayer[];
      setPlayersData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    getLeaderboard(selectedTab);
  }, [selectedTab]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Dashboard />

      <div className="flex-1 flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <IchackBanner />
          
          <div className="tabs flex justify-center gap-2 mb-6 animate-slideDown">
            {[
              { mode: stdModes.rapid, label: 'Rapid' },
              { mode: stdModes.blitz, label: 'Blitz' },
              { mode: stdModes.bullet, label: 'Bullet' }
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setSelectedTab(mode)}
                className={`
                  px-6 py-2 rounded-full font-semibold transform transition-all duration-300
                  hover:scale-105 hover:shadow-lg
                  ${selectedTab === mode
                    ? 'bg-blue-500 text-white shadow-md scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}
                `}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={`leaderboard-box transition-all duration-500 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 md:p-8 rounded-lg shadow-lg`}>
            <LeaderboardLayout 
              darkMode={darkMode} 
              players={playersData}
              isLoading={isLoading}
            >
              <button
                onClick={toggleDarkMode}
                className="absolute top-4 right-4 p-3 rounded-full bg-gray-100 dark:bg-gray-700 
                  hover:bg-gray-200 dark:hover:bg-gray-600 
                  transition-all duration-300 
                  hover:rotate-12 hover:scale-110
                  shadow-md"
                aria-label="Toggle theme"
              >
                {darkMode ? <FaSun className="text-white text-xl" /> : <FaMoon className="text-xl" />}
              </button>
            </LeaderboardLayout>
          </div>
        </div>
      </div>
    </div>
  );
}
