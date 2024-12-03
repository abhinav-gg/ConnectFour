import React from 'react'

interface AnalysisProps {
  currentPlayer: number
  evaluation: number
  explanation: string
  alternativeMoves: { column: number; evaluation: number }[]
}

const Analysis: React.FC<AnalysisProps> = ({ currentPlayer, evaluation, explanation, alternativeMoves }) => {
  const formatEvaluation = (eval_score: number) => {
    console.log(eval_score)
    if (Math.abs(eval_score) > 1000) {
      const movesToMate = Math.ceil(3628800 / Math.abs(eval_score)) - 1
      if (movesToMate <= 0) {
        return (
          <span className={`${eval_score > 0 ? 'bg-red-500' : 'bg-yellow-400'} text-white px-2 py-1 rounded font-bold`}>
            Game Over
          </span>
        )
      }
      return (
        <span className={`${eval_score > 0 ? 'bg-red-500' : 'bg-yellow-400'} text-white px-2 py-1 rounded font-bold`}>
          {`M${movesToMate}`}
        </span>
      )
    }
    return eval_score.toFixed(2)
  }

  // Sort moves by evaluation first, then by column if evaluations are equal
  const sortedMoves = [...alternativeMoves].sort((a, b) => {
    if (b.evaluation === a.evaluation) {
      return a.column - b.column  // Sort by column in ascending order if evaluations are equal
    }
    return b.evaluation - a.evaluation  // Sort by evaluation in descending order
  })

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Game Analysis</h2>
      <div className="mb-4">
        <h3 className="font-semibold">Current Evaluation:</h3>
        <p className="text-lg">
          {formatEvaluation(evaluation)}
        </p>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Explanation:</h3>
        <p>{explanation}</p>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Analysis:</h3>
        <ul className="space-y-2">
          {sortedMoves.map((move, index) => (
            <li key={index} className="flex justify-between items-center">
              <span>Column {move.column + 1}</span>
              <span className={move.evaluation > 0 ? 'text-red-500' : 'text-yellow-500'}>
                {formatEvaluation(move.evaluation)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Analysis