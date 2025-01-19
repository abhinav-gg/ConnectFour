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

    const token = localStorage.getItem('token'); // Check for token in local storage
    if (token) {
      const response = await fetch(`${await getConfig().backendUrl}/api/auth/protected-route`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
        },
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
    } else {
      if (onAuthFail) {
        onAuthFail();
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    checkAuthentication();
  }, []); // Run once on component mount

  return (
    <div>
      {verified ? children : <div>Checking your authentication status...</div>}
    </div>
  );
}
