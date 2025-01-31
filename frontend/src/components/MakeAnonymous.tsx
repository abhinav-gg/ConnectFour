'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import AuthPage from '@/components/checkAuth';
import { useReCaptcha } from '@/components/usecaptcha';
import { ReCaptchaWrapper } from '@/components/captcha';

export default function AnonymousLogin() {
  return (
    <ReCaptchaWrapper>
      <AnonymousPage />
    </ReCaptchaWrapper>
  );
}

// add a variable onSuccess to this component
function AnonymousPage () {
  const config = getConfig();
  const [error, setError] = useState<string | null>(null);
  const handleReCaptcha = useReCaptcha('anonymous');
  const isCreatingAccount = useRef<boolean>(false);

  useEffect(() => {
    console.log("MOUNTING", isCreatingAccount.current);
    if (isCreatingAccount.current) return;
    isCreatingAccount.current = (true);
    createAnonymousAccount();
  });

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

    const token = await handleReCaptcha();
    if (!token) {
      setError('ReCaptcha verification failed');
      isCreatingAccount.current = false;
      return;
    }

    try {
      const response = await fetch(`${config.backendUrl}/api/auth/anonymous?token=${token}`, {
        method: 'GET',
        credentials: 'include', // accept cookies from server
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create anonymous account');
      }

      const data = await response.json();
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
    <p>
      Creating anonymous account...
    </p>
  )
};