'use client'

import React, { useEffect, useState } from 'react'
import { Analysis, AnalysisProps } from '@/utils/analysis'
import { Player, Move } from '@/utils/game'
import { eventEmitter } from '@/utils/eventEmitter'
import { GameState } from '@/utils/game'

interface AnalysisHistoryProps {
  analysis: Analysis
}
export default function GameAnalysis({
  analysis,
}: AnalysisHistoryProps){
  const [updateCount, setUpdateCount] = useState(0); 
  const anal = analysis;
  

  const handleBoardUpdate: (data: { row: number; col: number; player: Player }) => void = (data) => {
    // Update the state or perform actions based on the board update
    console.log("Call analyzePosition")
    anal.analyzePosition()
    setUpdateCount(prev => prev + 1);
  };

  const formatEvaluation = (evalScore: number) => {

    if (Math.abs(evalScore) > 1000) {
      const movesToMate = Math.ceil(3628800 / Math.abs(evalScore)) - 1
      if (movesToMate <= 0) {
        return (
          <span className={`${evalScore > 0 ? 'bg-red-500' : 'bg-yellow-400'} text-white px-2 py-1 rounded font-bold`}>
            Game Over
          </span>
        )
      }
      return (
        <span className={`${evalScore > 0 ? 'bg-red-500' : 'bg-yellow-400'} text-white px-2 py-1 rounded font-bold`}>
          {`M${movesToMate}`}
        </span>
      )
    }
    return evalScore.toFixed(2)
  }

  // Sort moves by evaluation first, then by column if evaluations are equal
  const sortedMoves = [...anal.results.alternativeMoves].sort((a: any, b: any) => {
    if (b.evaluation === a.evaluation) {
      return a.column - b.column  // Sort by column in ascending order if evaluations are equal
    }
    return b.evaluation - a.evaluation  // Sort by evaluation in descending order
  })

  useEffect(() => {
    eventEmitter.on('boardUpdated', handleBoardUpdate);
    eventEmitter.on('boardSet', handleBoardUpdate);

    // Cleanup subscriptions on component unmount
    return () => {
      eventEmitter.off('boardUpdated', handleBoardUpdate);
      eventEmitter.off('boardSet', handleBoardUpdate);
    };
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg items-center justify-center overflow-hidden">
      <h2 className="text-xl font-bold mb-2">Analysis</h2>
      <div className="mb-4">
        <h3 className="font-semibold">Current Evaluation:</h3>
        <p className="text-lg">
          {formatEvaluation(anal.results.evaluation)}
        </p>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Explanation:</h3>
        <p>{anal.results.explanation}</p>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Analysis:</h3>
        <ul className="space-y-2">
          {sortedMoves.map((move: any, index: number) => (
            <li key={index} className="flex justify-between items-center">
              <span>Column {move.column + 1}:   </span>
              <span className={anal.results.evaluation > 0 ? 'text-red-500' : 'text-yellow-500'}>
                {formatEvaluation(move.evaluation)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}