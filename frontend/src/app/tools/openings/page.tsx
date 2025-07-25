// 'use client'

// import React, { useState, useEffect, useRef } from 'react'
// import MoveHistory from '@/components/game/history'
// import SinglePlayerGameboard from '@/components/game/singleplayer_gameboard'
// import Dashboard from '@/components/sidebar'
// import GameAnalysis from '@/components/game/analysis'
// import Opening from '@/components/game/opening'
// import { GameState } from '@shared/utils/game'

// export default function OpeningPage() {
//     const gameBoardRef = useRef<GameState>();
//     gameBoardRef.current = new GameState();

//   return (
//     <div className="min-h-screen bg-gray-100 flex">
//       <Dashboard />
//       <div className="flex-1 flex items-center justify-center p-4">
//         <SinglePlayerGameboard ref={gameBoardRef.current} />
//       </div>
//       <div className="flex-1 items-center justify-center h-full">
//         <div className="p-4">
//         <MoveHistory ref={gameBoardRef.current} />
//         </div><br/><br/>
//         <div className="p-4">
//         <Opening ref={ gameBoardRef.current } />
//         </div>
//       </div>
//     </div>
//   )
// }