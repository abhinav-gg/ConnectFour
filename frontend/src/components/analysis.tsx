import React from 'react'

interface AnalysisProps {
  currentPlayer: number
  evaluation: number
  explanation: string
  alternativeMoves: { column: number; evaluation: number }[]
}

const Analysis: React.FC<AnalysisProps> = ({ currentPlayer, evaluation, explanation, alternativeMoves }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Game Analysis</h2>
      <div className="mb-4">
        <h3 className="font-semibold">Current Evaluation:</h3>
        <p className={`text-lg ${evaluation > 0 ? 'text-red-500' : 'text-yellow-500'}`}>
          {evaluation.toFixed(2)} {evaluation > 0 ? 'in favor of Red' : 'in favor of Yellow'}
        </p>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Explanation:</h3>
        <p>{explanation}</p>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Alternative Moves:</h3>
        <ul className="space-y-2">
          {alternativeMoves.map((move, index) => (
            <li key={index} className="flex justify-between items-center">
              <span>Column {move.column + 1}</span>
              <span className={move.evaluation > 0 ? 'text-red-500' : 'text-yellow-500'}>
                {move.evaluation.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Analysis