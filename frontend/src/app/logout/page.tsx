'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token'); // Assuming the token is stored in local storage

    if (!token) {
    router.push('/login'); // Redirect to login if no token
    return;
    }

    const logoutUser = async () => {
      try {

        const response = await fetch(`${getConfig().backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          localStorage.removeItem('token'); // Remove token from local storage
          router.push('/'); // Redirect to homepage
        } else {
          const data = await response.json();
          console.error(data.error); // Handle error if needed
          router.push('/'); // Redirect to homepage even on error
        }
      } catch (error) {
        console.error('Logout failed:', error);
        router.push('/'); // Redirect to homepage on error
      }
    };

    logoutUser();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-lg font-semibold">Logging out...</h1>
    </div>
  );
}
