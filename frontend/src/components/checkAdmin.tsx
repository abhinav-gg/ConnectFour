'use client'

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import NotFound from '@/app/not-found'; // Import the NotFound component

interface CheckAdminProps {
  children: ReactNode; // Define children prop
}

export default function CheckAdmin({ children }: CheckAdminProps) { // Accept children as props
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // State to hold admin status
  const [error, setError] = useState<string | null>(null); // State to hold error messages

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch(`${getConfig().backendUrl}/api/auth/isadmin`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch admin status');
        }

        const data = await response.json();
        setIsAdmin(data.isAdmin); // Set admin status
      } catch (err: any) {
        setIsAdmin(false);
        setError(err.message);
      }
    };

    checkAdminStatus();
  }, [router]);

  if (error) {
    return <div className="text-red-500">{error}</div>; // Display error message
  }

  if (isAdmin === null) {
    return <div>Loading...</div>; // Show loading state while checking admin status
  }

  // If the user is not an admin, render the NotFound page
  if (!isAdmin) {
    return <NotFound />; // Redirect to NotFound page
  }

  // Render children if the user is an admin
  return <>{children}</>; // Render the children
}