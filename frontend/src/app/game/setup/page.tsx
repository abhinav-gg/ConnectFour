'use client';

import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/sidebar';
import { TimeControl, GameMode, GameInfo } from '@shared/Models/gameInfo';
import { StandardTimecontrols } from '@shared/constants';
import { ReCaptchaWrapper } from '@/components/auth/captcha';
import { useReCaptcha } from '@/components/auth/usecaptcha';
import AnonymousLogin from '@/components/auth/MakeAnonymous';
import Loading from '@/components/loading';

export default function SetupPage() {
  return (
    <ReCaptchaWrapper>
      <Setup />
    </ReCaptchaWrapper>
  );
}

const Setup = () => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthChoice, setShowAuthChoice] = useState(false);
  const [anonymousPageVisible, setAnonymousPageVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Game setup states
  const [selectedTimeControl, setSelectedTimeControl] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameType, setGameType] = useState<'standard' | 'friendly' | 'computer' | null>(null);
  const socket = useRef<WebSocket>();
  const URL = getConfig().backendUrl;
  const [roomId, setRoomId] = useState('');
  const [opacities, setOpacities] = useState<number[]>([]);
  const handleReCaptcha = useReCaptcha('join');
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const COOLDOWN_PERIOD = 5000; // 3 seconds in milliseconds

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(`${getConfig().backendUrl}/api/auth/protected-route`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setShowAuthChoice(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setShowAuthChoice(true);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // Animation effect for time controls
  useEffect(() => {
    if (!isAuthenticated) return;
    
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
  }, [isAuthenticated]);

  const handleAnonymous = () => {
    if (anonymousPageVisible) return;
    setAnonymousPageVisible(true);
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

const requestGame = async () => {
    const selectedControl = StandardTimecontrols.find((control) => control.id === selectedTimeControl);

    if (!selectedControl) {
        setMessage('Please select a time control');
        return;
    }

    const { base, increment, disadvantage } = selectedControl;
    if (!gameType) {
      setMessage('Please select a game type');
      return;
    }

    const token = await handleReCaptcha();
    if (!token) {
      setMessage('ReCaptcha verification failed');
      return;
    }

    try {
      const response = await fetch(`${URL}/api/game/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gamemode: { name: gameType, event: null } as GameMode,
          time_control: {
            base_time: base,
            increment: increment,
            disadvantage: disadvantage
          } as TimeControl,
          token: token,
        } as GameInfo),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = '/game?room=' + data.data.roomId;
      } else {
        const data = await response.json();
        if (data.error)
          setMessage(data.error);
        else
          setMessage('Failed to find match, you are in queue...');
        setupWebSocket();
      }
    } catch (error) {
      console.error('Game request failed:', error);
      setMessage('Failed to request game');
    }
  };

  const setupWebSocket = () => {
    if (!socket.current?.readyState || socket.current.readyState === 3) {
      const backendUrl = getConfig().websocketUrl;
      const newSocket = new WebSocket(backendUrl + "/finding-game");
      
      socket.current = newSocket;
      newSocket.onopen = () => console.log('WebSocket connected!');
      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'sendToRoom') {
          window.location.href = '/game?room=' + data.data.roomId;
        }
      };
    }
  };

  const handleRoomIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId) {
      window.location.href = '/game?room=' + roomId;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Check if enough time has passed since last request
    const currentTime = Date.now();
    if (currentTime - lastRequestTime < COOLDOWN_PERIOD) {
      setMessage(`Please wait ${Math.ceil((COOLDOWN_PERIOD - (currentTime - lastRequestTime)) / 1000)} seconds before requesting another game`);
      return;
    }
    
    console.log('Requesting game...', selectedTimeControl, gameType);
    try {
      setIsSubmitting(true);
      setMessage('Requesting game...');
      setLastRequestTime(currentTime);
      await requestGame();
    } catch (error) {
      setMessage('Error requesting game');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (<Loading />);
  }

  // Show authentication options if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-3xl font-bold mb-6">Welcome to the Game</h1>
          {showAuthChoice && (
            <div className="mt-4">
              <p className="mb-4">You are not logged in. Please choose an option:</p>
              <button
                onClick={handleAnonymous}
                className="bg-blue-500 text-white py-2 px-4 rounded-md mr-2 hover:bg-blue-600"
              >
                Continue as Anonymous
              </button>
              <button
                onClick={handleLogin}
                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
              >
                Log In
              </button>
            </div>
          )}
          {anonymousPageVisible && <AnonymousLogin />}
        </div>
      </div>
    );
  }

  // Show game setup if authenticated
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-6">Search for a Game</h1>
        {message && <p className="text-lg">{message}</p>}
        
        {/* Room ID Form */}
        <form onSubmit={handleRoomIdSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md mb-4">
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

        {/* Game Setup Form */}
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
                {control.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col space-y-2">
            <button 
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors transform hover:scale-105 text-sm sm:text-base"
              onClick={() => setGameType('standard')}>
              Compete
            </button>
            <button 
              type="submit"
              className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition-colors transform hover:scale-105 text-sm sm:text-base"
              onClick={() => setGameType('friendly')}>
              Play with Friends
            </button>
            <p className="text-center w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors transform hover:scale-105 text-sm sm:text-base">
              Play Computer (Coming Soon)
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
