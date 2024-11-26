'use client';
import { useState, useEffect } from 'react';

export default function TestDB() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:3001/api/test-db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => setError(err.message));
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl mb-4">Database Test Page</h1>
            {error && <p className="text-red-500">Error: {error}</p>}
            {data && (
                <div className="bg-gray-100 p-4 rounded">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
