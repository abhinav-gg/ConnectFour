'use client'

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Player, GameState } from '@/utils/game';
import { eventEmitter } from '@/utils/eventEmitter';
import { getConfig } from '@/config/env';
import remarkHtml from 'remark-html';

// Define a type for the response
interface FetchResponse {
  status: string;
  data: string;
}

// Update the fetchMarkdownContent function to use the new type
async function fetchMarkdownContent(position: String): Promise<string> {
  // send request to a backend URL
  try {
    const response = await fetch(`${getConfig().backendUrl}/api/openings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ position })
    });
    const result: FetchResponse = await response.json(); // Use the defined type
    return result.data;
  } catch (err: any) {
    console.error('Failed to fetch markdown content:', err);
    return '';
  }
}

interface OpeningProps {
  ref: GameState;
}

export default function Opening({ ref }: OpeningProps) {
  const [content, setContent] = useState<String>("# Enter a move to see the opening book");

  const handleBoardUpdate: (data: { row: number; col: number; player: Player }) => void = (data) => {
    // Update the state or perform actions based on the board update
    console.log("Call OpeningBook")
    // add a slide to ref.currentMoveIndex
    let relevantMoves = ref.getMoves().slice(0, ref.currentMoveIndex+1).map(({ col }) => col.toString()).join('')
    fetchMarkdownContent(relevantMoves)
      .then((data: string) => {
        console.log(data);
        setContent(data);
      });
  };

  useEffect(() => {
    eventEmitter.on('boardUpdated', handleBoardUpdate);
    eventEmitter.on('boardSet', handleBoardUpdate);

    // Cleanup subscriptions on component unmount
    return () => {
      eventEmitter.off('boardUpdated', handleBoardUpdate);
      eventEmitter.off('boardSet', handleBoardUpdate);
    };
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg items-center justify-center overflow-hidden">
        <div className="markdown">
        <ReactMarkdown 
          children={typeof content === 'string' ? content : ''} 
          remarkPlugins={[remarkHtml]}
        />
        </div>
    </div>
  );
}
