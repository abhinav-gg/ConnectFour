'use client'

import { useEffect, useState } from 'react';
import CheckAdmin from '@/components/auth/adminOnly';
import Dashboard from '@/components/sidebar';
import Loading from '@/components/loading';

interface LiveGame {
  id: string;
  name: string;
  // Add other relevant fields for the live game
}

export default function LiveGamesPage() {
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        const response = await fetch('/api/admin/liveview');
        if (!response.ok) {
          throw new Error('Failed to fetch live games');
        }
        const data = await response.json();
        setLiveGames(data); // Assuming the API returns an array of live games
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveGames();
  }, []);

  if (loading) {
    return <Loading/>; // Show loading state
  }

  if (error) {
    return <div className="text-red-500">{error}</div>; // Display error message
  }

  return (
    <CheckAdmin>
      <Dashboard/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {liveGames.map((game) => (
            <div key={game.id} className="border p-4 rounded shadow">
              <h3 className="font-bold">{game.name}</h3>
              {/* Display other game details here */}
            </div>
          ))}
        </div>
    </CheckAdmin>
  );
}
