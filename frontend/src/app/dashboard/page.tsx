'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard'; // Import the Dashboard component

// Define the User type
interface User {
  username: string;
  email: string;
  created_at: string; // Adjust the type if necessary
}

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // Use the User type
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token'); // Retrieve the token

      if (!token) {
        // If no token, redirect to login
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${getConfig().backendUrl}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setUser(data); // Set user data
      } catch (err: any) {
        setError(err.message);
        // Optionally redirect to login if there's an error
        router.push('/login');
      }
    };

    fetchUserProfile();
  }, [router]);

  if (error) {
    return <div className="text-red-500">{error}</div>; // Display error message
  }

  if (!user) {
    return <div>Loading...</div>; // Show loading state while fetching user data
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard /> {/* Render the Dashboard component on the side */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">User Dashboard</h1>
        <p className="text-gray-700">Welcome, {user.username}!</p>
        <button className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Delete Account</button>
        <p className="text-gray-700 mt-6">More coming soon</p>
      </div>
    </div>
  );
}
