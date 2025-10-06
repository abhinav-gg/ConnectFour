'use client';

import { useEffect, useState } from 'react';
import Loading from '@/components/loading';
import { eventsApi } from '@/utils/apiClient';
import { logger } from '@/utils/logger';

export default function DiscordCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setStatus('error');
      setError('No code parameter found');
      return;
    }

    eventsApi.post<{ message: string }>('/ichack25/discord', { code })
      .then((response) => {
        logger.auth('Discord callback response:', response);
        
        if (response.success) {
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/events/ichack25/leaderboard';
          }, 2000);
        } else {
          setStatus('error');
          
          // Handle specific error status codes
          if (response.status === 400 || response.status === 401) {
            setError('Authentication Failed, Ensure you are not logged into an Anonymous account...');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
          } else if (response.status === 403) {
            setError('Not registered for ICHack 25');
            setTimeout(() => {
              window.location.href = '/events/ichack25?error=not-ichack';
            }, 2000);
          } else {
            setError(response.error || 'Discord callback failed');
          }
        }
      })
      .catch((err: any) => {
        console.error('📱 Discord callback error:', err);
        setStatus('error');
        setError(err.message || 'Unknown error occurred');
      });
  }, []);

  if (status === 'loading') {
    return <Loading/>;
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