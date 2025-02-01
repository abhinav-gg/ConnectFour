'use client'

import { useEffect } from 'react';
import { getConfig } from '@/config/env';

export default function Logout() {

  useEffect(() => {

      const logoutUser = async () => {
      try {

        const response = await fetch(`${getConfig().backendUrl}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          window.location.href = '/'; // Redirect to homepage on success
        } else {
          const data = await response.json();
          console.error(data.error); // Handle error if needed
          window.location.href = '/'; // Redirect to homepage on success
        }
      } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = '/'; // Redirect to homepage on success
      }
    };

    logoutUser();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-lg font-semibold">Logging out...</h1>
    </div>
  );
}
