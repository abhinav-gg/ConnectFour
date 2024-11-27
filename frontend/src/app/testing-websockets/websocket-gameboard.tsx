// 'use client'

// import { useState, useEffect, useRef, useCallback } from 'react'
// import Link from 'next/link'
// import { Home, LogIn, RotateCcw, FileText, ChevronDown } from 'lucide-react'
// import { io, Socket } from 'socket.io-client';

// type Player = 1 | 2
// type Cell = Player | null

// const ROWS = 6
// const COLS = 7

// interface WebSocketGameBoardProps {
//   socket: Socket | null;
//   playerNumber: number | null;
//   isConnected: boolean;
//   playersCount: number;
//   gameStatus: string;
//   roomId: string;
//   onMove: (col: number) => void;
//   moves: Array<{ player: number; column: number; row: number; }>;
// }

// const SOCKET_URL = 'http://localhost:3001'

// interface Move {
//   player: number;
//   column: number;
//   row: number;
// }

// export default function WebSocketGameBoard({ socket, playerNumber, isConnected, playersCount, gameStatus, roomId, onMove, moves }: WebSocketGameBoardProps) {
//   const [board, setBoard] = useState<Cell[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
//   const [currentPlayer, setCurrentPlayer] = useState<Player>(1)
//   const [winner, setWinner] = useState<Player | null>(null)
//   const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)
//   const [fallingPiece, setFallingPiece] = useState<{ row: number, col: number, player: Player } | null>(null)
//   const [gameOver, setGameOver] = useState(false)
//   const audioRef = useRef<HTMLAudioElement | null>(null)

//   useEffect(() => {
//     if (!gameOver) {
//       resetGame()
//     }
//   }, [gameOver])

//   useEffect(() => {
//     audioRef.current = new Audio('/drop-sound.mp3')
//   }, [])

//   useEffect(() => {
//     const newSocket = io(SOCKET_URL, {
//       withCredentials: true,
//       transports: ['polling', 'websocket'],
//       reconnectionDelay: 1000,
//       reconnectionAttempts: 5,
//       autoConnect: true
//     });

//     setSocket(newSocket);

//     newSocket.on('connect', () => {
//       console.log('Socket connected successfully');
//       setIsConnected(true);
//       newSocket.emit('joinGame', roomId);
//     });

//     newSocket.on('playerJoined', ({ playersCount, playerNumber }) => {
//       setPlayersCount(playersCount);
//       if (playersCount === 1) {
//         setGameStatus('Waiting for opponent...');
//       }
//     });

//     newSocket.on('roomFull', ({ message }) => {
//       setGameStatus('Room is full. Please try another room.');
//     });

//     newSocket.on('gameStart', ({ firstPlayer, players }) => {
//       setPlayerNumber(newSocket.id === firstPlayer ? 1 : 2);
//       setGameStatus('Game started!');
//       resetGame();
//     });

//     newSocket.on('playerDisconnected', ({ message, playersCount }) => {
//       setPlayersCount(playersCount);
//       setGameStatus('Opponent disconnected. Waiting for new player...');
//       setGameOver(true);
//     });

//     newSocket.on('moveMade', ({ col, player }) => {
//       console.log(`Processing move from player ${player} on column ${col}`);
//       const newBoard = [...board];
//       for (let row = ROWS - 1; row >= 0; row--) {
//         if (!newBoard[row][col]) {
//           setMoves(prev => [...prev, { player, column: col, row }]);
//           setFallingPiece({ row: -1, col, player });
//           animatePieceFall(row, col, player);
//           setCurrentPlayer(player === 1 ? 2 : 1);
//           break;
//         }
//       }
//     });

//     return () => {
//       newSocket.close();
//     };
//   }, [roomId]);

//   const dropPiece = (col: number) => {
//     if (winner || 
//         fallingPiece || 
//         gameOver || 
//         !isConnected || 
//         !playerNumber || 
//         currentPlayer !== playerNumber) {
//       console.log('Move rejected:', { 
//         winner, 
//         fallingPiece, 
//         gameOver, 
//         isConnected, 
//         playerNumber, 
//         currentPlayer,
//         message: 'Not your turn'
//       });
//       return;
//     }

//     const newBoard = [...board];
//     for (let row = ROWS - 1; row >= 0; row--) {
//       if (!newBoard[row][col]) {
//         socket?.emit('makeMove', { roomId, col });
//         break;
//       }
//     }
//   };

//   const handleOpponentMove = (col: number) => {
//     console.log(`Received opponent move on column ${col} via WebSocket`);
    
//     const newBoard = [...board];
//     for (let row = ROWS - 1; row >= 0; row--) {
//       if (!newBoard[row][col]) {
//         const opponentPlayer = playerNumber === 1 ? 2 : 1;
//         setMoves(prev => [...prev, { player: opponentPlayer, column: col, row }]);
//         setFallingPiece({ row: -1, col, player: opponentPlayer });
//         animatePieceFall(row, col, opponentPlayer);
//         break;
//       }
//     }
//   };

//   const animatePieceFall = (targetRow: number, col: number, player: Player) => {
//     let currentRow = -1;
//     const fallInterval = setInterval(() => {
//       if (currentRow < targetRow) {
//         currentRow++;
//         setFallingPiece(prev => ({ ...prev!, row: currentRow, player }));
//       } else {
//         clearInterval(fallInterval);
//         setFallingPiece(null);
//         const newBoard = [...board];
//         newBoard[targetRow][col] = player;
//         setBoard(newBoard);
//         checkWinner(targetRow, col, player);
//       }
//     }, 100);
//   };

//   const checkWinner = (row: number, col: number, player: Player) => {
//     const directions = [
//       [0, 1], [1, 0], [1, 1], [1, -1]
//     ];

//     for (const [dx, dy] of directions) {
//       let count = 1;
//       for (const factor of [-1, 1]) {
//         let r = row + factor * dx;
//         let c = col + factor * dy;
//         while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
//           count++;
//           r += factor * dx;
//           c += factor * dy;
//         }
//       }
//       if (count >= 4) {
//         setWinner(player);
//         setGameOver(true);
//         return;
//       }
//     }

//     if (board.every(row => row.every(cell => cell !== null))) {
//       setGameOver(true);
//     }
//   };

//   const resetGame = useCallback(() => {
//     setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
//     setCurrentPlayer(1)
//     setWinner(null)
//     setFallingPiece(null)
//     setGameOver(false)
//     socket?.emit('resetGame', { roomId });
//   }, [socket, roomId])

//   const handleColumnHover = (col: number) => {
//     if (!gameOver && !fallingPiece) {
//       setHighlightedColumn(col)
//     }
//   }

//   const handleColumnLeave = () => {
//     setHighlightedColumn(null)
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 flex">
//       {/* Dashboard */}
//       <div className="w-64 bg-white p-4 flex flex-col shadow-md">
//         <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
//         <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-2">
//           <Home className="mr-2" />
//           Home
//         </Link>
//         <Link href="/login" className="flex items-center text-gray-600 hover:text-gray-800 mb-2">
//           <LogIn className="mr-2" />
//           Login
//         </Link>
//         <div className="text-sm text-gray-600 mt-4">
//           Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
//         </div>
//       </div>

//       {/* Game Board */}
//       <div className="flex-1 flex flex-col items-center justify-center p-4">
//         <h1 className="text-4xl font-bold text-gray-800 mb-8">Connect Four (WebSocket)</h1>
        
//         {/* Game Status */}
//         <div className="mb-4 text-lg font-semibold text-gray-700">
//           {gameStatus}
//         </div>
        
//         <div className="mb-4 text-sm">
//           {playerNumber && <span className="mr-4">You are Player {playerNumber}</span>}
//           {currentPlayer === playerNumber && <span className="text-green-500">Your turn!</span>}
//           <span className="ml-4">Players: {playersCount}/2</span>
//         </div>

//         <div className="relative">
//           {/* Chevron indicators */}
//           <div className="absolute top-[-24px] left-0 right-0 flex justify-around">
//             {Array(COLS).fill(null).map((_, colIndex) => (
//               <div key={`chevron-${colIndex}`} className="w-12 flex justify-center">
//                 {highlightedColumn === colIndex && !gameOver && !fallingPiece && (
//                   <ChevronDown className="text-orange-500 animate-bounce" />
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Game board with invisible input areas */}
//           <div className="bg-blue-500 p-4 rounded-lg shadow-lg">
//             <div className="relative">
//               {/* Invisible input areas */}
//               <div className="absolute top-0 left-0 right-0 bottom-0 flex">
//                 {Array(COLS).fill(null).map((_, colIndex) => (
//                   <div
//                     key={`input-${colIndex}`}
//                     className="flex-1 cursor-pointer"
//                     onClick={() => dropPiece(colIndex)}
//                     onMouseEnter={() => handleColumnHover(colIndex)}
//                     onMouseLeave={handleColumnLeave}
//                   />
//                 ))}
//               </div>

//               {/* Game grid */}
//               {board.map((row, rowIndex) => (
//                 <div key={rowIndex} className="flex">
//                   {row.map((cell, colIndex) => (
//                     <div
//                       key={colIndex}
//                       className="w-12 h-12 bg-blue-300 border-2 border-blue-600 rounded-full m-1 flex items-center justify-center overflow-hidden"
//                     >
//                       {(cell !== null || (fallingPiece && fallingPiece.col === colIndex && fallingPiece.row === rowIndex)) && (
//                         <div
//                           className={`w-10 h-10 rounded-full ${
//                             (cell === 1 || (fallingPiece && fallingPiece.col === colIndex && fallingPiece.row === rowIndex && fallingPiece.player === 1)) 
//                               ? 'bg-red-500' 
//                               : 'bg-yellow-400'
//                           } transition-transform duration-100`}
//                           style={{
//                             transform: fallingPiece && fallingPiece.col === colIndex
//                               ? `translateY(${(fallingPiece.row - rowIndex) * 100}%)`
//                               : 'none'
//                           }}
//                         />
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {gameOver && (
//           <div className="mt-4 text-center">
//             {winner ? (
//               <div className="text-2xl font-bold text-orange-500 mb-4">
//                 Player {winner} wins!
//               </div>
//             ) : (
//               <div className="text-2xl font-bold text-orange-500 mb-4">
//                 It's a draw!
//               </div>
//             )}
//             <div className="flex gap-4">
//               <button
//                 onClick={resetGame}
//                 className="bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
//               >
//                 <RotateCcw className="mr-2" />
//                 New Game
//               </button>
//               <button
//                 className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
//               >
//                 <FileText className="mr-2" />
//                 Review Game
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Move History */}
//       <div className="w-64 bg-white p-4 flex flex-col shadow-md">
//         <h2 className="text-2xl font-bold text-gray-800 mb-4">Move History</h2>
//         <div className="overflow-y-auto max-h-[600px]">
//           {moves.map((move, index) => (
//             <div key={index} className={`p-2 mb-1 rounded ${
//               move.player === playerNumber ? 'bg-blue-100' : 'bg-gray-100'
//             }`}>
//               Player {move.player}: Column {move.column + 1}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }