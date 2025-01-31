'use client';

import { ChatMessage } from '@shared/Models/gameInfo';
import { useEffect, useState } from 'react';
import { eventEmitter } from '@shared/utils/eventEmitter';
import { DrawMatrix } from '@shared/Types/gameData';

export default function LiveChat({ 
    pNum,
    pMessages, 
    pDrawMatrix,
    onSendMessage
}: { 
    pNum: number;
    pMessages: ChatMessage[];
    pDrawMatrix: DrawMatrix;
    onSendMessage: (message: string) => void;
}) {
    const [inputMessage, setInputMessage] = useState('');
    const [chatCooldown, setChatCooldown] = useState(0);
    const [confirmResign, setConfirmResign] = useState(false);
    const [updateCount, setUpdateCount] = useState(0);
    // New simplified draw states
    const drawMatrix = pDrawMatrix
    const messages = pMessages;

    useEffect(() => {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        setChatCooldown(0.5);
    }, [messages]);

    useEffect(() => {
      console.log(drawMatrix);
        const interval = setInterval(() => {
            setChatCooldown((prev) => Math.max(0, prev - 0.1));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleDrawOffered = () => {
          drawMatrix.acceptAction = (true);
          drawMatrix.offerAction = (false);
          drawMatrix.confirmAction = (false);
        };

        eventEmitter.on('drawOffered', handleDrawOffered);
        return () => {
            eventEmitter.off('drawOffered', handleDrawOffered);
        };
    }, []);

    const handleDrawButton = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('handleDrawButton', drawMatrix);
      if (!drawMatrix.confirmAction) {
        drawMatrix.confirmAction = (true);
        setUpdateCount((prev) => prev + 1);
        setTimeout(() => { drawMatrix.confirmAction = false;setUpdateCount((prev) => prev + 1); }, 3000);
        return;
        // Handle accepting a draw
      } else if (drawMatrix.acceptAction) {
          eventEmitter.emit('acceptDraw');
          drawMatrix.acceptAction = (false);
          drawMatrix.confirmAction = (false);
        } else {
            eventEmitter.emit('tryDraw');
            drawMatrix.offerAction = (true);
            drawMatrix.confirmAction = (false);
        }
        setUpdateCount((prev) => prev + 1);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        if (chatCooldown > 0 || pNum === -1) return;
        e.preventDefault();
        onSendMessage(inputMessage);
        setInputMessage('');
        setChatCooldown(2);
    };

    const handleResign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmResign) {
            setConfirmResign(true);
            setTimeout(() => setConfirmResign(false), 3000);
            return;
        }
        eventEmitter.emit('tryResign');
        setConfirmResign(false);
    };

    const ControlButtons = (
        <div className="flex gap-2">
              <button
              onClick={handleDrawButton}
              disabled={drawMatrix.offerAction}
              className={`flex-1 px-2 md:px-4 py-2 text-sm md:text-base rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${drawMatrix.offerAction 
                      ? 'bg-gray-300 cursor-not-allowed'
                      : drawMatrix.confirmAction
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-yellow-400 hover:bg-yellow-500'
                  } text-white`}
          >
              {drawMatrix.offerAction 
                  ? 'Waiting...' 
                  : drawMatrix.confirmAction 
                      ? ('Confirm Draw')
                      : (drawMatrix.acceptAction ? 'Accept Draw' : 'Offer Draw')}
          </button>
            <button
                onClick={handleResign}
                className={`flex-1 px-2 md:px-4 py-2 text-sm md:text-base rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${confirmResign 
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white`}
            >
                {confirmResign ? 'Confirm Resign' : 'Resign'}
            </button>
        </div>
    );

    // Rest of the component remains the same...
    return (
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-lg w-full flex flex-col">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Live Chat</h2>
            <div 
                id="chatContainer"
                className="flex-1 overflow-y-auto mb-2 md:mb-4 scrollbar-thin min-h-[200px] max-h-[300px]"
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
            {pNum !== -1 && (
                <div>
                    <form onSubmit={handleSendMessage} className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Send
                        </button>
                    </form> 
                    {ControlButtons}
                </div>
            )}
        </div>
    );
}