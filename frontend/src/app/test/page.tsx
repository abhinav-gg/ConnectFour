'use client';
import SingleplayerBoardHandler from "@/components/boards/Handlers/SingleplayerBoardHandler";
import PuzzleHandler from "@/components/boards/Handlers/PuzzleHandler";
import { Puzzle } from "@shared/utils/puzzles";


export default function Page() {
  return <SingleplayerBoardHandler />

  // return (
  //   <div className="flex flex-col items-center justify-center min-h-screen">
  //     <h1 className="text-2xl font-bold mb-4">Puzzle Handler Test</h1>
  //     <PuzzleHandler puzzle={new Puzzle(puzzleString)} />
  //   </div>
  // );
}


// import { useWebSocketContext } from '@/components/websocketProvider';
// import React, { useEffect, useState } from 'react';

// export default function WebSocketClientDemo() {
//   const { sendJson, getLastJson, readyState } = useWebSocketContext();
//   const [lastMessage, setLastMessage] = useState<any | null>(null);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const latest = getLastJson();
//       if (latest !== lastMessage) {
//         setLastMessage(latest);
//       }
//     }, 500);

//     return () => clearInterval(interval);
//   }, [getLastJson, lastMessage]);

//   return (
//     <div>
//       <h2>Status: {['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][readyState]}</h2>
//       <button onClick={() => sendJson({ type: 'chat', content: 'Hello WebSocket!' })}>
//         Send JSON
//       </button>
//       <pre>{JSON.stringify(lastMessage, null, 2) || 'No message received yet'}</pre>
//     </div>
//   );
// }