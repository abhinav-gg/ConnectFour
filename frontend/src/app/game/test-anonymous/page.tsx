'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
 
const TestAnonymousPage = () => {
  const router = useRouter();
  const config = getConfig();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createAnonymousAccount = async () => {
      try {
        const response = await fetch(`${config.backendUrl}/api/auth/anonymous`, {
          method: 'GET'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create anonymous account');
        }

        const data = await response.json();
        localStorage.setItem('token', data.data.accessToken);
        router.push('/game/test-join');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
        console.error('Error creating anonymous account:', error);
      }
    };

    createAnonymousAccount();
  }, [router, config.backendUrl]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return <div>Creating anonymous account...</div>;
};

export default TestAnonymousPage;
