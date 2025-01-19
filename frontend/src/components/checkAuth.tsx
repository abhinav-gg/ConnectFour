import React, { ReactNode, useEffect, useState } from 'react';
import { getConfig } from '@/config/env';

interface CheckAuthProps {
  children: ReactNode; // Define children prop
  onAuthFail?: () => void;
  onAuthSuccess?: () => void;
}

export default function AuthPage({ children, onAuthFail, onAuthSuccess }: CheckAuthProps) {
  const [verified, setVerified] = useState(false);

  const checkAuthentication = async () => {
    if (verified) return;
    try {
      const token = localStorage.getItem('token'); // Check for token in local storage
      if (token) {
        console.log('Checking authentication...', token);
        const response = await fetch(`${await getConfig().backendUrl}/api/auth/protected-route`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        console.log("Response: ", response);
        if (!response.ok) {
          if (onAuthFail) {
            console.log("failing auth")
            try {

              await onAuthFail();
            }
            catch (error) {
              console.log("Critical error")
              return;
            }
          } else {
            console.log('User not authenticated');
          }
        }
        else {
          if (onAuthSuccess) {
            await onAuthSuccess();
          }
          setVerified(true);
        }
      } else {
        console.log("No token found")
        if (onAuthFail) {
          try {
            await onAuthFail();
          }
          catch (error) {
            console.log("Critical error")
            return;
          }
        }
      }
    }
    catch (error) {
      console.log('Failed to authenticate user:', error);
      if (onAuthFail) {
        await onAuthFail();
      }
    }
  }

  useEffect(() => {
    if (!verified)
      checkAuthentication();
  }, []);
  
  return (
    <div>
      {verified ? children : <div>Checking your authentication status...</div>}
    </div>
  );
}
