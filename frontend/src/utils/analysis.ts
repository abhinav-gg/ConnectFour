import { Cell, ROWS, COLS, checkWinner, GameState } from './game'

const INFINITY = 69
const MAX_DEPTH = 2
const MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6] // Center-first column ordering

export interface Analysis {
  evaluation: number
  explanation: string
  alternativeMoves: { column: number; evaluation: number }[]
}

function makeMove(board: Cell[][], col: number, player: 1 | 2): { row: number; success: boolean } {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      board[row][col] = player
      return { row, success: true }
    }
  }
  return { row: -1, success: false }
}

function undoMove(board: Cell[][], row: number, col: number) {
  board[row][col] = null
}

function evaluatePosition(board: Cell[][]): number {
  // Only evaluate actual wins, not threats
  return 0
}

function minimax(
  board: Cell[][],
  depth: number,
  maximizingPlayer: boolean
): number {
  console.log(`\nMinimax at depth ${depth}, ${maximizingPlayer ? 'RED' : 'YELLOW'} to play`)
  console.log('Current board:')
  board.forEach(row => console.log(row.map(cell => cell === null ? '.' : cell).join(' ')))

  // Create temporary GameState to check position
  const gameState = new GameState()
  gameState.board = board
  gameState.checkGameOver()
  if (gameState.gameOver) {
    if (gameState.winner === 1) return INFINITY
    if (gameState.winner === 2) return -INFINITY
    return 0  // Draw
  }

  if (depth >= MAX_DEPTH) {
    const evalScore = evaluatePosition(board)
    console.log(`Max depth reached. Static evaluation: ${evalScore}`)
    return evalScore
  }

  const moves = MOVE_ORDER.filter(col => board[0][col] === null)
  if (moves.length === 0) {
    console.log('No moves available, returning 0')
    return 0
  }

  console.log(`Available moves: ${moves.join(', ')}`)
  const currentPlayer = maximizingPlayer ? 1 : 2
  let bestValue = maximizingPlayer ? -INFINITY : INFINITY
  
  for (const col of moves) {
    console.log(`\nTrying move column ${col} for ${currentPlayer === 1 ? 'RED' : 'YELLOW'}`)
    const { row, success } = makeMove(board, col, currentPlayer)
    if (!success) {
      console.log(`Move in column ${col} failed`)
      continue
    }

    if (checkWinner(board, row, col, currentPlayer)) {
      console.log(`Winning move found for ${currentPlayer === 1 ? 'RED' : 'YELLOW'} in column ${col}`)
      undoMove(board, row, col)
      const winValue = maximizingPlayer ? INFINITY : -INFINITY
      console.log(`Returning win value: ${winValue}`)
      return winValue
    }

    const score = minimax(board, depth + 1, !maximizingPlayer)
    undoMove(board, row, col)
    console.log(`Move column ${col} evaluated to ${score}`)

    if (maximizingPlayer) {
      bestValue = Math.max(bestValue, score)
      console.log(`RED: Updated best value to ${bestValue}`)
    } else {
      bestValue = Math.min(bestValue, score)
      console.log(`YELLOW: Updated best value to ${bestValue}`)
    }
  }

  console.log(`Depth ${depth} returning bestValue: ${bestValue}`)
  return bestValue
}

export function analyzePosition(board: Cell[][], currentPlayer: 1 | 2): Analysis {
  console.clear()
  const moves = MOVE_ORDER.filter(col => board[0][col] === null)
  
  // Clone board for initial evaluation
  const boardCopy = board.map(row => [...row])
  const evaluation = minimax(boardCopy, 0, currentPlayer !== 1)
  
  const alternativeMoves: { column: number; evaluation: number }[] = []
  for (const col of moves) {
    // Clone board for each move evaluation
    const moveBoardCopy = board.map(row => [...row])
    const { row, success } = makeMove(moveBoardCopy, col, currentPlayer === 1 ? 2 : 1)
    if (!success) continue
    alternativeMoves.push({ 
      column: col, 
      evaluation: minimax(moveBoardCopy, 0, currentPlayer === 1) 
    })
  }
  
  let explanation = "Position is equal"
  if (evaluation === INFINITY) {
    explanation = "Winning position found"
  } else if (evaluation === -INFINITY) {
    explanation = "Position is lost"
  } else if (evaluation > 0) {
    explanation = "Advantage for current player"
  } else if (evaluation < 0) {
    explanation = "Opponent has the advantage"
  }

  return {
    evaluation,
    explanation,
    alternativeMoves: alternativeMoves.sort((a, b) => b.evaluation - a.evaluation)
  }
}
