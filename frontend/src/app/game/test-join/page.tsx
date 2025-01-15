'use client';

import { useEffect, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import { TimeControl, GameMode, GameInfo } from '@shared/Models/gameInfo';
import { StandardGamemodes } from '@shared/constants';
import AuthPage from '@/components/checkAuth';

const TestJoinPage = () => {
  const [selectedTimeControl, setSelectedTimeControl] = useState('');
  const [message, setMessage] = useState('');

  const requestGame = async () => {
      
    const token = localStorage.getItem('token');
    const selectedControl = StandardGamemodes.find((control) => control.id === selectedTimeControl);

    if (!selectedControl) {
      console.error('Selected time control not found');
      return;
    }

    const { base, increment, disadvantage } = selectedControl;

    const response = await fetch(`${getConfig().backendUrl}/api/game/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        gamemode: {
          name: 'friendly',
          event: null
        } as GameMode,
        time_control: {
          base_time: base,
          increment: increment,
          disadvantage: disadvantage } as TimeControl,
      } as GameInfo),
    });
    if (!response.ok) {
      console.error('Failed to request game');
      return;
    }
    const data = await response.json();
    console.log('Game requested:', data);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the game search logic here
    console.log('Searching for game with time control:', selectedTimeControl);
    requestGame();
  };

  const handleNotAuth = () => {
    window.location.href = '/game/test-login';
  }

  return (
    <AuthPage
      onAuthFail={handleNotAuth}>
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-6">Search for a Game</h1>
        {message && <p className="text-lg">{message}</p>}
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Select Time Control</h2>
          <div className="flex flex-wrap justify-center mb-4">
            {StandardGamemodes.map((control) => (
              <div className="flex justify-center mb-2 mx-2" key={control.id}>
                <button
                  type="button"
                  className={`py-2 px-4 rounded-lg ${selectedTimeControl === control.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setSelectedTimeControl(control.id)}
                >
                  {control.label}{`(${control.base}+${control.increment}-${control.disadvantage})`}
                </button>
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Search Game
          </button>
        </form>
      </div>
    </div>
  </AuthPage>
  );
};

export default TestJoinPage;
