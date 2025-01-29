'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import AuthPage from '@/components/checkAuth';

// add a variable onSuccess to this component
export default function TestAnonymousPage () {
  const router = useRouter();
  const config = getConfig();
  const [error, setError] = useState<string | null>(null);

  const onSuccess = () => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (!roomFromUrl) {
      window.location.href = '/game/test-join';
      return;
    } else {
      window.location.href = '/game?room=' + roomFromUrl;
    }
  }

  const createAnonymousAccount = async () => {
    console.log("Creating anonymous account...");
    try {
      const response = await fetch(`${config.backendUrl}/api/auth/anonymous`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create anonymous account');
      }

      const data = await response.json();
      localStorage.setItem('token', data.data.sessionToken);
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error creating anonymous account:', error);
    }
  };

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