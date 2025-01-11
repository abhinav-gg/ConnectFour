'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import NotFound from '@/app/not-found'; // Import the NotFound component

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // State to hold admin status
  const [error, setError] = useState<string | null>(null); // State to hold error messages

  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = localStorage.getItem('token'); // Retrieve the token

      if (!token) {
        // display the page not found error to the user to hide the fact that the page exists
        setIsAdmin(false);
        return;
      }

      try {
        const response = await fetch(`${getConfig().backendUrl}/api/auth/isadmin`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
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

  // Render admin content if the user is an admin
  return (
    <div>
      {/* Admin content goes here */}
      <h1>Welcome to the Admin Page</h1>
      {/* Additional admin functionalities */}
    </div>
  );
}