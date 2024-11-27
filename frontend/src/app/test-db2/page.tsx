'use client';
import { useState, useEffect } from 'react';
import { config } from '@/config/env';

interface User {
    id: string;
    username: string;
    email: string;
    created_at: string;
    updated_at: string;
    last_login: string | null;
}

export default function TestDB2() {
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${config.backendUrl}/api/users`)
            .then(res => res.json())
            .then(data => {
                setUsers(data.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl mb-4">All Users</h1>
            
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            
            {users.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Username</th>
                                <th className="p-2 border">Email</th>
                                <th className="p-2 border">Created At</th>
                                <th className="p-2 border">Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="p-2 border">{user.username}</td>
                                    <td className="p-2 border">{user.email}</td>
                                    <td className="p-2 border">{new Date(user.created_at).toLocaleString()}</td>
                                    <td className="p-2 border">{new Date(user.updated_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>No users found.</p>
            )}
        </div>
    );
}