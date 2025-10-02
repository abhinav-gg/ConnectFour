'use client'

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import NotFound from '@/app/not-found'; // Import the NotFound component
import Loading from '../loading';
import { authApi } from '@/utils/apiClient';

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
        console.log('🔐 Checking admin status...');
        const response = await authApi.isAdmin();

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch admin status');
        }

        console.log('🔐 Admin check response:', response.data);
        setIsAdmin(response.data?.isAdmin || false);
      } catch (err: any) {
        console.error('🔐 Admin check failed:', err);
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
    return <Loading />; // Show loading state while checking admin status
  }

  // If the user is not an admin, render the NotFound page
  if (!isAdmin) {
    return <NotFound />; // Redirect to NotFound page
  }

  // Render children if the user is an admin
  return <>{children}</>; // Render the children
}