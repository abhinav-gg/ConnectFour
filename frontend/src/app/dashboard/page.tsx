'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
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
      <Dashboard /> {/* Render the Dashboard component on the side */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">User Dashboard</h1>
        <p className="text-gray-700">Welcome, {user.username ? user.username : "Anonymous"}!</p>
        <button className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Delete Account</button>
        <p className="text-gray-700 mt-6">More coming soon</p>
      </div>
    </div>
  );
}
