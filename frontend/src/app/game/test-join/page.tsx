'use client';

import { useEffect, useRef, useState } from 'react';
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
  const socket = useRef<WebSocket>();
  const URL = getConfig().backendUrl;
  const [roomId, setRoomId] = useState('');
  const [opacities, setOpacities] = useState<number[]>([]);

  useEffect(() => {
    const duration = 2000;
    const staggerDelay = 200;
    const steps = 20;
    const stepTime = duration / steps;

    StandardTimecontrols.forEach((_, index) => {
      for (let step = 1; step <= steps; step++) {
        setTimeout(() => {
          setOpacities(prev => {
            const newOpacities = [...prev];
            newOpacities[index] = step / steps;
            return newOpacities;
          });
        }, index * staggerDelay + step * stepTime);
      }
    });
  }, []);

  const requestGame = async () => {
      
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
      },
      credentials: 'include',
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
      console.log('Failed to request game');
      setMessage(data.error)

      if (!socket.current?.readyState || socket.current.readyState === 3) {  
        const backendUrl = getConfig().websocketUrl;
        const newSocket = new WebSocket(backendUrl + "/finding-game");
        
        socket.current = newSocket;
        console.log("set socket", socket, newSocket);
        newSocket.onopen = () => {
          console.log('WebSocket connected!');

        };

        newSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.event === 'sendToRoom') {
            window.location.href = '/game?room=' + data.data.roomId;
          }
        }
      }
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

  const handleRoomIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId) {
      window.location.href = '/game?room=' + roomId;
    }
  };

  return (
    <AuthPage onAuthFail={handleNotAuth}>
      <div className="flex min-h-screen bg-gray-100">
        <Dashboard />
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Search for a Game</h1>
          {message && <p className="text-base sm:text-lg text-center px-2">{message}</p>}
          
          <form onSubmit={handleRoomIdSubmit} className="w-full max-w-md bg-white p-4 sm:p-8 rounded-lg shadow-md mb-4 mx-2">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors">
              Join Room
            </button>
          </form>

          <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-4 sm:p-8 rounded-lg shadow-md mx-2">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Select Time Control</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {StandardTimecontrols.map((control, index) => (
                <button
                  key={control.id}
                  type="button"
                  className={`py-2 px-3 rounded-lg text-sm sm:text-base break-words ${
                    selectedTimeControl === control.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => setSelectedTimeControl(control.id)}
                  style={{ opacity: opacities[index] }}
                >
                  {control.label}{`(${control.base}+${control.increment}-${control.disadvantage})`}
                </button>
              ))}
            </div>

            <div className="flex flex-col space-y-2">
              <button 
                type="button"
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors transform hover:scale-105 text-sm sm:text-base"
                onClick={() => setGameType('standard')}>
                Create Game
              </button>
              <button 
                type="button"
                className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition-colors transform hover:scale-105 text-sm sm:text-base"
                onClick={() => setGameType('friendly')}>
                Play with Friends
              </button>
              <button 
                type="button"
                className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors transform hover:scale-105 text-sm sm:text-base"
                onClick={(e) => e.preventDefault()}>
                (Coming Soon)
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthPage>
  );
};

export default TestJoinPage;
