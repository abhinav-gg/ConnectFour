'use client'

import { useEffect, useState, ReactNode } from 'react';
import { getConfig } from '@/config/env';

interface CheckAuthProps {
  children: ReactNode; // Define children prop
  // add a callback function if the auth fails
  onAuthFail?: () => void;
  onAuthSuccess?: () => void;
}

export default function AuthPage({ children, onAuthFail, onAuthSuccess }: CheckAuthProps) { // Accept children as props
  const [verified, setVerified] = useState(false); // Define a state variable to store the verification status
  const [Loading, setLoading] = useState(false);

  const checkAuthentication = async () => {
    try {
      if (Loading){
        return;
      }
      const token = localStorage.getItem('token'); // Check for token in local storage
      if (token) {
        console.log('Checking authentication...', token);
        setLoading(true);
        const response = await fetch(`${getConfig().backendUrl}/api/auth/protected-route`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        console.log("Response: ", response);
        if (!response.ok) {
          if (onAuthFail) {
            console.log("failing auth")
            onAuthFail();
          } else {
            console.log('User not authenticated');
          }
          return;
        }
        else {
          setVerified(true);
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }
      } else {
        console.log("No token found")
        throw new Error('No token found');
      }
    }
    catch (error) {
      console.error('Failed to authenticate user:', error);
      if (onAuthFail) {
        onAuthFail();
      }
      setLoading(false);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!verified && !Loading) {
        checkAuthentication();
      }
    }, 2000); // Check every other second until verified

    // Initial check
    checkAuthentication();

    return () => clearInterval(interval);
  }, [verified]); // Only depend on verified state

  if (!verified) {
    return (<div><p>Loading...</p></div>);
  }
  
  return <>{children}</>;
}