'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
 
const TestAnonymousPage = () => {
  const router = useRouter();
  const config = getConfig();

  useEffect(() => {
    const token = localStorage.getItem('token'); // Check for token in local storage
    const createAnonymousAccount = async () => {
      try {
        const response = await fetch(`${config.backendUrl}/api/auth/anonymous`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });

        if (!response.ok) {
          throw new Error('Failed to create anonymous account');
        }

        const data = await response.json();
        console.log('Anonymous account created:', data);
        // Redirect to /game after successful account creation
        localStorage.setItem('token', data.data.accessToken);
        router.push('/game');
      } catch (error) {
        console.error('Error creating anonymous account:', error);
      }
    };

    createAnonymousAccount();
  }, [router]);

  return <div>Creating anonymous account...</div>;
};

export default TestAnonymousPage;
