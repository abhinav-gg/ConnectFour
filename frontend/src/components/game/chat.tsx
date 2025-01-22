'use client';

import { ChatMessage } from '@shared/Models/gameInfo';
import { useEffect, useRef, useState } from 'react';

export default function LiveChat({ 
  pMessages, 
  onSendMessage 
}: { 
  pMessages: ChatMessage[];
  onSendMessage: (message: string) => void;
}) {
    const [inputMessage, setInputMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [chatCooldown, setChatCooldown] = useState(0);
    const messages = pMessages; // use React reference to avoid re-rendering
    console.log("All messages: ", messages);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
        setChatCooldown(0.5);
    }, [messages, messages.length]);

    // Always reduce the chat cooldown by 0.1 every 100ms
    useEffect(() => {
        const interval = setInterval(() => {
            setChatCooldown((prev) => Math.max(0, prev - 0.1));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        if (chatCooldown > 0) {
            return;
        }
        e.preventDefault();
        onSendMessage(inputMessage);
        setInputMessage('');
        setChatCooldown(2);
    }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg w-full h-[400px] flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Live Chat</h2>
      
      {/* Chat messages container with custom scrollbar */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 scrollbar-thin"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#E5E7EB transparent'
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            {msg.isAnnouncement ? (
              <p className="font-bold text-black">{msg.message}</p>
            ) : (
              <p>
                <span className={`font-semibold ${
                  msg.playerNumber === 0 ? 'text-red-600' : 
                  msg.playerNumber === 1 ? 'text-yellow-600' : 
                  'text-gray-600'
                }`}>
                  {msg.username}:
                </span>{' '}
                <span className="text-gray-700">{msg.message}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}