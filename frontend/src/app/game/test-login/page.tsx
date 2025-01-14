'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showChoice, setShowChoice] = useState(false); // New state for showing choice buttons
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('token'); // Check for token in local storage
      if (token) {
        const response = await fetch(`${getConfig().backendUrl}/api/auth/protected-route`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        if (!response.ok) {
          console.log('User not authenticated');
        } else {
          router.push('/game/test-join');
          return;
        }
      }
      // If no token, show choice buttons
      setShowChoice(true);
    };

    checkAuthentication();
  }, [router]);

  const handleAnonymous = () => {
    try {
      router.push('/game/test-anonymous'); // Redirect to anonymous login page
    } catch (error) {
      console.error('Error creating anonymous account:', error);
      alert('Failed to create anonymous account. Please try again.');
    }
  };

  const handleLogin = () => {
    router.push('/login'); // Redirect to login page
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
      </div>
    </div>
  );
};

export default HomePage;