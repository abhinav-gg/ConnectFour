'use client';

import { useEffect, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import { TimeControl, GameMode, GameInfo, SendToRoom } from '@shared/Models/gameInfo';
import { StandardTimecontrols } from '@shared/constants';
import AuthPage from '@/components/checkAuth';

const TestJoinPage = () => {
  const [selectedTimeControl, setSelectedTimeControl] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameType, setGameType] = useState<'standard' | 'friendly' | 'computer' | null>(null);
  const URL = getConfig().backendUrl;

  const requestGame = async () => {
      
    const token = localStorage.getItem('token');
    const selectedControl = StandardTimecontrols.find((control) => control.id === selectedTimeControl);

    if (!selectedControl) {
      setMessage('Please select a time control');
      console.error('Selected time control not found');
      return;
    }
    if (!gameType) {
      setMessage('Please select a game type');
      console.error('Selected game mode not found');
      return;
    }

    const { base, increment, disadvantage } = selectedControl;

    const response = await fetch(`${URL}/api/game/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        gamemode: {
          name: gameType,
          event: null
        } as GameMode,
        time_control: {
          base_time: base,
          increment: increment,
          disadvantage: disadvantage } as TimeControl,
      } as GameInfo),
    });
    if (!response.ok) {
      const data = await response.json();
      console.error('Failed to request game');
      setMessage(data.message)
      return;
    }
    else {
      const data = (await response.json());
      console.log('Game requested:', data);
      window.location.href = '/game?room=' + data.data.roomId;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    console.log('Requesting game...', selectedTimeControl, gameType);
    try {
      setIsSubmitting(true);
      setMessage('Requesting game...');
      requestGame();
    } catch (error) {
      setMessage('Error requesting game');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotAuth = () => {
    const roomFromUrl = new URLSearchParams(window.location.search).get('room');
    if (!roomFromUrl) {
      window.location.href = '/game/test-login';
      return;
    } else {
      window.location.href = '/game/test-login?room=' + roomFromUrl;
    }
  }

  return (
    <AuthPage onAuthFail={handleNotAuth}>
      <div className="flex min-h-screen bg-gray-100">
        <Dashboard />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-3xl font-bold mb-6">Search for a Game</h1>
          {message && <p className="text-lg">{message}</p>}
          <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Select Time Control</h2>
            <div className="flex flex-wrap justify-center mb-4">
              {StandardTimecontrols.map((control) => (
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
            <div className="flex flex-col space-y-2">
              <button className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
                onClick={() => setGameType('standard')}>
                Create Game
              </button>
              <button className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition-colors"
                onClick={() => setGameType('friendly')}>
                Play with Friends
              </button>
              <button className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors"
                onClick={() => setGameType('friendly')}>
                Play Computer
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthPage>
  );
};

export default TestJoinPage;
