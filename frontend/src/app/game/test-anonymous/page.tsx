'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import AuthPage from '@/components/checkAuth';

const TestAnonymousPage = () => {
  const router = useRouter();
  const config = getConfig();
  const [error, setError] = useState<string | null>(null);
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
  }

  const onSuccess = () => {
    router.push('/game/test-join');
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <AuthPage
      onAuthFail={ createAnonymousAccount }
      onAuthSuccess={ onSuccess }>
        <div>Made Anonymous account...</div>
    </AuthPage>
  );
};

export default TestAnonymousPage;
