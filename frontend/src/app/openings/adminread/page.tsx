'use client';
import { useState, useEffect } from 'react';
import { getConfig } from '@/config/env';

interface entry {
    guid: string;
    oname: string;
}

export default function TestDB2() {
    const [users, setUsers] = useState<entry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${getConfig().backendUrl}/api/allopenings1`)
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
            <script>window.location.href = '/';</script>
            <noscript>This page is under maintenance. Please try again later.</noscript>
            <h1 className="text-2xl mb-4">All Users</h1>
            
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            
            {users.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr className="bg-gray-100">
                            <th className="p-2 border">ID</th>
                                <th className="p-2 border">Name</th>
                            </tr>
                        </thead>
                        <tbody className='text-center'>
                            {users.map(user => (
                                <tr key={user.guid}>
                                    <td className="p-2 border">{user.guid}</td>
                                    <td className="p-2 border">{user.oname}</td>
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