import React, { ReactNode, useEffect, useState } from 'react';
import Loading from '../loading';
import { api } from '@/utils/apiClient';
import { logger, printl } from '@/utils/logger';

interface CheckAuthProps {
  children: ReactNode; // Define children prop
  onAuthFail?: () => void;
  onAuthSuccess?: () => void;
}

export default function AuthPage({ children, onAuthFail, onAuthSuccess }: CheckAuthProps) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkAuthentication = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    const response = await api.get<{ user: any }>('/api/auth/protected-route');

    if (!response.success) {
      logger.authError('Auth check failed', response.error);
      if (onAuthFail) {
        onAuthFail();
      }
    } else {
      logger.auth('Auth check successful');
      setVerified(true);
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    }


    setLoading(false);
  };

  useEffect(() => {
    checkAuthentication();
  }, []); // Run once on component mount

  return (
    <div>
      {verified ? children : <Loading/>}
    </div>
  );
}
