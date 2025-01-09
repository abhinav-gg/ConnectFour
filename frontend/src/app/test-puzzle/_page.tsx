// 'use client'

// import React, { useState } from 'react'


// export default function Puzzle (){
//   const [currentMove, setCurrentMove] = useState<number>(0)
//   const [message, setMessage] = useState<string>('')
//   const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
//   const [gameOver, setGameOver] = useState<boolean>(false)

//   const rows = 6
//   const cols = 7

//   const resetPuzzle = () => {
//     setBoard(initialBoard)
//     setCurrentMove(0)
//     setMessage('')
//     setIsCorrect(null)
//     setGameOver(false)
//   }

//   const checkMove = (col: number) => {
//     if (gameOver) return

//     if (col === solution[currentMove]) {
//       const newBoard = [...board]
//       for (let row = rows - 1; row >= 0; row--) {
//         if (!newBoard[row][col]) {
//           newBoard[row][col] = 1 // Assuming the player is always red (1)
//           setBoard(newBoard)
//           break
//         }
//       }

//       setCurrentMove(currentMove + 1)
//       setMessage('Correct move!')
//       setIsCorrect(true)

//       if (currentMove + 1 === solution.length) {
//         setMessage('Congratulations! You solved the puzzle!')
//         setGameOver(true)
//       }
//     } else {
//       setMessage('Incorrect move. Try again!')
//       setIsCorrect(false)
//     }
//   }

//   return (
//     <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
//       <div className="w-full flex justify-between items-center mb-4">
//         <div className="text-lg font-semibold">
//           Puzzle ELO: <span className="text-blue-600">{eloRating}</span>
//         </div>
//         <div className="text-lg font-semibold">
//           Puzzle ID: <span className="text-gray-600">{puzzleId}</span>
//         </div>
//       </div>

//       <div className="grid grid-cols-7 gap-2 bg-blue-500 p-4 rounded-lg mb-4">
//         {board.map((row, rowIndex) =>
//           row.map((cell, colIndex) => (
//             <div
//               key={`${rowIndex}-${colIndex}`}
//               className={`w-12 h-12 rounded-full ${
//                 cell === 1 ? 'bg-red-500' : cell === 2 ? 'bg-yellow-400' : 'bg-white'
//               } transition-all duration-300 ease-in-out`}
//               style={{
//                 transform: `translateY(${(rows - 1 - rowIndex) * 100}%)`,
//                 opacity: cell !== null ? 1 : 0,
//               }}
//             />
//           ))
//         )}
//       </div>

//       {!gameOver && (
//         <div className="grid grid-cols-7 gap-2 mb-4">
//           {[0, 1, 2, 3, 4, 5, 6].map((col) => (
//             <button
//               key={col}
//               className="w-12 h-12 bg-blue-300 rounded-full hover:bg-blue-400 transition-colors"
//               onClick={() => checkMove(col)}
//               aria-label={`Drop piece in column ${col + 1}`}
//             />
//           ))}
//         </div>
//       )}

//       <div className={`text-center mb-4 ${
//         isCorrect === true ? 'text-green-600' : 
//         isCorrect === false ? 'text-red-600' : 
//         'text-gray-600'
//       }`}>
//         <p className="text-lg font-semibold">{message}</p>
//       </div>

//       <div className="flex space-x-4">
//         <button
//           onClick={resetPuzzle}
//           className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors"
//         >
//           Reset Puzzle
//         </button>
//         <button
//           onClick={() => {/* Implement next puzzle logic */}}
//           className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
//         >
//           Next Puzzle
//         </button>
//       </div>
//     </div>
//   )
// }