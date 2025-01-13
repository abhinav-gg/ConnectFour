'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('token'); // Check for token in local storage

      if (token) {
        // If token exists, redirect to /test-join
        router.push('/test-join');
        
      } else {
        // If no token, prompt user for action
        const userChoice = confirm("You are not logged in. Would you like to continue as an anonymous user? Click 'Cancel' to log in.");

        if (userChoice) {
          // User chose to continue as anonymous
          try {
            router.push('/game/test-anonymous'); // Redirect to anonymous login page
            
          } catch (error) {
            console.error('Error creating anonymous account:', error);
            alert('Failed to create anonymous account. Please try again.');
          }
        } else {
            // User chose to log in
            router.push('/login'); // Redirect to login page
          
        }
      }
    };

    checkAuthentication();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to the Game</h1>
        <p className="text-lg">Checking your authentication status...</p>
      </div>
    </div>
  );
};

export default HomePage;