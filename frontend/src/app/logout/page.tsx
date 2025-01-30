'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {

      const logoutUser = async () => {
      try {

        const response = await fetch(`${getConfig().backendUrl}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
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
