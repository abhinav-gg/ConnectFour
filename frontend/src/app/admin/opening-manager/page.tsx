'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard'; // Import the Dashboard component
import AdminPage from '../checkAdmin'; // Import the CheckAdmin component

export default function AddOpening() {
  const router = useRouter();
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token'); // Retrieve the token
      const response = await fetch(`${getConfig().backendUrl}/api/make-opening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
        },
        body: JSON.stringify({ position, description }),
      });

      console.log('Response:', response);

      if (!response.ok) {
        throw new Error('Failed to add opening');
      }
      const data = await response.json();
      setSuccess('Opening added successfully!');
      setPosition('');
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <AdminPage>
      <div className="flex min-h-screen bg-gray-100">
        <Dashboard /> {/* Render the Dashboard component on the side */}
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Opening</h1>
          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-500">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
              <input
                type="text"
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Add Opening
            </button>
          </form>
        </div>
      </div>
    </AdminPage>
  );
}