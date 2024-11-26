'use client';

import { useState, useEffect } from 'react';
import WebSocketGameBoard from './websocket-gameboard';
import io from 'socket.io-client';

export default function TestingWebsockets() {
  const [roomId, setRoomId] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
      console.log('Client Socket.IO connected!');
    });

    socket.on('connection_test', (message) => {
      console.log(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setHasJoined(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!hasJoined ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md w-96 text-black">
            <h1 className="text-2xl font-bold mb-6 text-center">Join Game Room</h1>
            <div className="space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleJoinRoom}
                className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      ) : (
        <WebSocketGameBoard roomId={roomId} />
      )}
    </div>
  );
}
