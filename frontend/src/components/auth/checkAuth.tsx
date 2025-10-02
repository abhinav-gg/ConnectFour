import React, { ReactNode, useEffect, useState } from 'react';
import Loading from '../loading';
import { authApi } from '@/utils/apiClient';

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

    const response = await authApi.protectedRoute();

    if (!response.success) {
      console.log('🔐 Auth check failed:', response.error);
      if (onAuthFail) {
        onAuthFail();
      }
    } else {
      console.log('🔐 Auth check successful');
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
