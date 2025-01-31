'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getConfig } from '@/config/env';

export default function DiscordCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setError('No code parameter found');
      return;
    }

    fetch(`${getConfig().backendUrl}/api/events/ichack25/discord`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const responseText = await res.text();

        if (res.status === 400 || res.status === 401) {
          setStatus('error');
          setError('Authentication required, redirecting to login...');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }

        if (res.status === 403) {
          setStatus('error');
          setError('Not registered for ICHack 25');
          setTimeout(() => {
            router.push('/events/ichack25?error=not-ichack');
          }, 2000);
          return;
        }

        if (res.status >= 200 && res.status < 300) {
          setStatus('success');
          setTimeout(() => {
            router.push('/events/ichack25/leaderboard');
          }, 2000);
          return;
        }

        // For any other error status
        setStatus('error');
        setError(responseText || 'An unexpected error occurred');
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message);
      });
  }, [searchParams, router]);

  if (status === 'loading') {
    return <div className="p-8 text-center">Connecting your Discord account...</div>;
  }

  if (status === 'error') {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8 text-center text-green-500">
      Successfully connected Discord! Redirecting...
    </div>
  );
}