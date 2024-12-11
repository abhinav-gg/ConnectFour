'use client';
import { useState } from 'react';
import { getConfig } from '@/config/env';

export default function TestDB() {
  const [name, setName] = useState('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${getConfig().backendUrl}/api/writeopening1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    }
  };


  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Database Test Page</h1>

      <form onSubmit={handleRegister} className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter username"
          className="border p-2 mr-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create User
        </button>
      </form>

      {error && <p className="text-red-500">Error: {error}</p>}
      {data && (
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
