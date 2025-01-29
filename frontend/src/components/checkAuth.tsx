import React, { ReactNode, useEffect, useState } from 'react';
import { getConfig } from '@/config/env';

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


    const response = await fetch(`${await getConfig().backendUrl}/api/auth/protected-route`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (onAuthFail) {
        onAuthFail();
      }
    } else {
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
      {verified ? children : <div>Checking your authentication status...</div>}
    </div>
  );
}
