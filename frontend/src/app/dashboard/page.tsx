'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface User {
  username: string;
  email: string;
  created_at: string;
}

interface EloData {
  date: string;
  rating: number;
}

interface EloHistory {
  bullet: EloData[];
  blitz: EloData[];
  rapid: EloData[];
}

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [eloHistory, setEloHistory] = useState<EloHistory | null>(null);
  const [activeTab, setActiveTab] = useState<'bullet' | 'blitz' | 'rapid'>('rapid');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${getConfig().backendUrl}/api/auth/profile`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch user profile');
        const data = await response.json();
        setUser(data);
        setFormData({ ...formData, username: data.username, email: data.email });
      } catch (err: any) {
        setError(err.message);
        router.push('/login');
      }
    };

    const fetchEloHistory = async () => {
      try {
        const response = await fetch(`${getConfig().backendUrl}/api/player-elo`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch ELO history');
        const data = await response.json();
        setEloHistory(data);
      } catch (err: any) {
        console.error('Error fetching ELO history:', err);
      }
    };

    fetchUserProfile();
    fetchEloHistory();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${getConfig().backendUrl}/api/auth/update-profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      setIsEditing(false);
      // Refresh user data
      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getChartData = (type: 'bullet' | 'blitz' | 'rapid') => {
    if (!eloHistory) return null;

    return {
      labels: eloHistory[type].map(entry => new Date(entry.date).toLocaleDateString()),
      datasets: [
        {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ELO Rating`,
          data: eloHistory[type].map(entry => entry.rating),
          borderColor: type === 'bullet' ? '#FF6B6B' : type === 'blitz' ? '#4ECDC4' : '#45B7D1',
          tension: 0.4,
          fill: false,
        },
      ],
    };
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard />
      <div 
        className="flex-1 p-8 animate-fade-in"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">User Dashboard</h1>
          
          {/* Profile Section */}
          <section 
            className="bg-white rounded-lg shadow-md p-6 mb-6 animate-fade-in"
          >
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-gray-700">Username: {user.username}</p>
                <p className="text-gray-700">Email: {user.email}</p>
                <p className="text-gray-700">Account created: {new Date(user.created_at).toLocaleDateString()}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </section>

          {/* ELO Charts Section */}
          <section 
            className="bg-white rounded-lg shadow-md p-6 animate-fade-in"
          >
            <h2 className="text-xl font-semibold mb-4">ELO History</h2>
            <div className="flex gap-4 mb-4">
              {(['bullet', 'blitz', 'rapid'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="h-[400px]">
              {eloHistory && getChartData(activeTab) && (
                <Line
                  data={getChartData(activeTab)!}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                      },
                    },
                  }}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
