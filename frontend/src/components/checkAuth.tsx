'use client'

import { useEffect, useState, ReactNode } from 'react';
import { getConfig } from '@/config/env';
import NotFound from '@/app/not-found'; // Import the NotFound component

interface CheckAdminProps {
  children: ReactNode; // Define children prop
  // add a callback function if the auth fails
  onAuthFail?: () => void;
  onAuthSuccess?: () => void;
}

export default function AuthPage({ children, onAuthFail, onAuthSuccess }: CheckAdminProps) { // Accept children as props

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem('token'); // Check for token in local storage
      if (token) {
        const response = await fetch(`${getConfig().backendUrl}/api/auth/protected-route`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        if (!response.ok) {
          if (onAuthFail) {
            onAuthFail();
          } else {
            console.log('User not authenticated');
          }
          return;
        }
        else {
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }
      }
    }
    checkAuthentication();
  });

  // Render children if the user is an admin
  return <>{children}</>; // Render the children
}