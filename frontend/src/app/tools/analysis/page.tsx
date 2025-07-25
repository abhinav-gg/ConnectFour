// 'use client'

// import React, { useState, useEffect, useRef } from 'react'
// import MoveHistory from '@/components/game/history'
// import SinglePlayerGameboard from '@/components/game/singleplayer_gameboard'
// import Dashboard from '@/components/sidebar'
// import GameAnalysis from '@/components/game/analysis'
// import { Analysis } from '@shared/utils/old_analysis'
// import { GameState } from '@shared/utils/game'

// export default function AnalysisPage() {
//     const gameBoardRef = useRef<GameState>(new GameState());
//     const [moveString, setMoveString] = useState('');

//     const setMoves = (moves: string) => {
//       // first verify that the moves are valid (list of numbers 1-7 no spaces)
//       if (!moves.match(/^[1-7]+$/)) {
//         return;
//       }
//       const moveList = moves.split('');
//       //console.log(moveList);
//       gameBoardRef.current.setMoves(moveList.map(move => parseInt(move)-1));
//     }

//     const handleExport = () => {
//         if (gameBoardRef.current) {
//             const moves = gameBoardRef.current!.getMoves().map(move => (move.col + 1).toString()).join('');
//             setMoveString(moves);
//         }
//     };

//     const handleImport = () => {
//         // console.log(moveString);
//         setMoves(moveString);
//     };

//   const spBoard = <SinglePlayerGameboard ref={gameBoardRef.current} />

//   const analView = (<div className="flex-1 items-center justify-center h-full">
//     <div className="p-4">
//     <MoveHistory ref={gameBoardRef.current} />
//     </div><br/><br/>
//     <div className="p-4">
//     <GameAnalysis analysis={new Analysis(gameBoardRef.current)} />
//     </div>
//   </div>);

//   return (
//     <div className="min-h-screen bg-gray-100 flex">
//       <Dashboard />
//       <div className="flex-1 flex flex-col items-center justify-center p-4">
//         { spBoard }
//         <div className="mt-4 flex gap-2 items-center">
//             <input
//                 type="text"
//                 value={moveString}
//                 onChange={(e) => setMoveString(e.target.value)}
//                 className="border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter moves (e.g., 1234)"
//             />
//             <button
//                 onClick={handleImport}
//                 className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//             >
//                 Import
//             </button>
//             <button
//                 onClick={handleExport}
//                 className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
//             >
//                 Export
//             </button>
//         </div>
//       </div>
//       { analView }
//     </div>
//   )
// }