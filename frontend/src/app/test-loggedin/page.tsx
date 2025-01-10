// frontend/src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Profile() {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token'); // Assuming the token is stored in local storage

        if (!token) {
        router.push('/login'); // Redirect to login if no token
        return;
        }

        try {
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
            'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setUsername(data.username); // Assuming the response contains the username
        } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        router.push('/login'); // Redirect to login on error
        }
    };

    fetchUserProfile();
    }, [router]);

    return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        {error && <div className="text-red-500">{error}</div>}
        {username ? (
        <h1 className="text-2xl">Welcome, {username}!</h1>
        ) : (
        <h1 className="text-2xl">Loading...</h1>
        )}
    </div>
    );
}