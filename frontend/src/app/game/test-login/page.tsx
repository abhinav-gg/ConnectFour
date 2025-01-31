'use client';

import { useEffect, useState } from 'react';
import { getConfig } from '@/config/env';
import AnonymousLogin from '@/components/MakeAnonymous';

const HomePage = () => {
  const [showChoice, setShowChoice] = useState(false); // New state for showing choice buttons
  const [anonymousPageVisible, setAnonymousPageVisible] = useState(false); // New state for showing the anonymous page

  const sendToJoin = () => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (!roomFromUrl) {
      window.location.href = '/game/test-join';
      return;
    } else {
      window.location.href = '/game?room=' + roomFromUrl;
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      // get room form params if exists
      const response = await fetch(`${getConfig().backendUrl}/api/auth/protected-route`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        console.log('User not authenticated');
      } else {
        sendToJoin();
        return;
      }
      // If no token, show choice buttons
      setShowChoice(true);
    };

    checkAuthentication();
  });

  const handleAnonymous = () => {
    if (anonymousPageVisible) return; // Prevent multiple anonymous page displays
    console.log("THIS MESSAGE SHOULD BE SHOWN ONCE");
    setAnonymousPageVisible(true); // Set the state to show the anonymous page
  };

  const handleLogin = () => {
    window.location.href = '/login'; // Redirect to login page
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to the Game</h1>
        <p className="text-lg">Checking your authentication status...</p>
        {showChoice && (
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
        {anonymousPageVisible && ( // Conditionally render the TestAnonymousPage
          <AnonymousLogin />
        )}
      </div>
    </div>
  );
};

export default HomePage;