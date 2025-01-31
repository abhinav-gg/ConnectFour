'use client';

import { useState, useEffect, useRef } from 'react';
import LeaderboardLayout from '@/components/ichleaderboard';
import { FaSun, FaMoon } from 'react-icons/fa';
import type { ICHackLeaderboardPlayer, leaderboardPlayer } from "@shared/Models/eventInfo";
import IchackBanner from '@/components/ichackbanner';
import { StandardGameModes } from '@shared/constants';
import { GameMode } from '@shared/Models/gameInfo';
import { getConfig } from '@/config/env';


export default function Leaderboard() {
  const stdModes = StandardGameModes.standard;
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState(stdModes.rapid);
  const backendUrl = getConfig().backendUrl;
  const players = useRef<ICHackLeaderboardPlayer[]>();

  const getLeaderboard = async (tab: string): Promise<void> => {
    const res = await fetch(`${backendUrl}/api/events/get-ichack25-leaderboard`,
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                gamemode: {
                    name: tab,
                    event: null
                } as GameMode })
        }
    );
    const data = await res.json() as ICHackLeaderboardPlayer[];
    console.log(data);
    players.current = data;
  }

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    getLeaderboard(selectedTab);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  return (
    <>

      <IchackBanner />
      <div className="tabs">
        <button onClick={() => setSelectedTab(stdModes.rapid)} className={selectedTab === stdModes.rapid ? 'active' : ''}>Rapid</button>
        <button onClick={() => setSelectedTab(stdModes.blitz)} className={selectedTab === stdModes.blitz ? 'active' : ''}>Blitz</button>
        <button onClick={() => setSelectedTab(stdModes.bullet)} className={selectedTab === stdModes.bullet ? 'active' : ''}>Bullet</button>
      </div>
      <LeaderboardLayout darkMode={darkMode} players={players.current ? players.current : []}>
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
