'use client';

import { useEffect, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';

const TestJoinPage = () => {
  const [selectedTimeControl, setSelectedTimeControl] = useState('');
  const [message, setMessage] = useState('');

  const timeControls = [
    { id: 'blitz', label: 'Blitz (5|0|30)' },
    { id: 'blitz2', label: 'Blitz (3|2|20)' },
    { id: 'rapid', label: 'Rapid (10|0|60)' },
    { id: 'bullet2', label: 'Bullet (2|1|15)' },
    { id: 'bullet3', label: 'Bullet (1|1|10)' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the game search logic here
    console.log('Searching for game with time control:', selectedTimeControl);
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve the token

        if (!token) {
            // If no token, redirect to login
            window.location.href = '/login';
            return;
        }
        const response = await fetch(`${getConfig().backendUrl}/api/auth/protected-route`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        if (!response.ok) {
          throw new Error('User not authenticated');
        }
        const data = await response.json();
        setMessage(data.message); // Set the message from the response
      } catch (error) {
        console.error('Error fetching protected route:', error);
        window.location.href = '/login'; // Redirect to login page
      }
    };

    checkAuthentication();
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-6">Search for a Game</h1>
        {message && <p className="text-lg">{message}</p>}
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Select Time Control</h2>
          <div className="flex flex-wrap justify-center mb-4">
            {timeControls.map((control) => (
              <div className="flex justify-center mb-2 mx-2" key={control.id}>
                <button
                  type="button"
                  className={`py-2 px-4 rounded-lg ${selectedTimeControl === control.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setSelectedTimeControl(control.id)}
                >
                  {control.label}
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
  );
};

export default TestJoinPage;
