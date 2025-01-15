import { Cell, ROWS, COLS, checkWinner, GameState } from './game'

const INFINITY = 3628800 // (10!) used for finding the distance to checkmate
const MAX_DEPTH = 5
const MAX_SUGGESTED_DEPTH = 3
const MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6] // Center-first column ordering

export interface AnalysisProps {
  evaluation: number
  explanation: string
  alternativeMoves: { column: number; evaluation: number }[]
}

export class Analysis {
  gameState: GameState
  results: AnalysisProps
  
  constructor(gameState: GameState) {
    this.gameState = gameState
    this.results = { evaluation: 0, explanation: 'Begin Game', alternativeMoves: [] }
  }

  makeMove(board: Cell[][], col: number, player: 1 | 2): { row: number; success: boolean } {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        board[row][col] = player
        return { row, success: true }
      }
    }
    return { row: -1, success: false }
  }

  undoMove(board: Cell[][], row: number, col: number) {
    board[row][col] = null
  }

  minimax(
    board: Cell[][],
    depth: number,
    maximizingPlayer: boolean,
    suggestion: boolean
  ): number {

    const GS = new GameState()
    GS.setBoard(board, true)
    GS.checkGameOver()

    if (GS.gameOver) {
      if (GS.winner === 1) return INFINITY / depth  // Divide by depth for mate distance
      if (GS.winner === 2) return -INFINITY / depth
      return 0  // Draw
    }


    if (depth >= (suggestion ? MAX_SUGGESTED_DEPTH : MAX_DEPTH)) {
      const evalScore = GS.evaluate()
      //console.log(`Max depth reached. Static evaluation: ${evalScore}`)
      return evalScore
    }

    const moves = MOVE_ORDER.filter(col => board[0][col] === null)
    if (moves.length === 0) {
      //console.log('No moves available, returning 0')
      return 0
    }

    //console.log(`Available moves: ${moves.join(', ')}`)
    const currentPlayer = maximizingPlayer ? 1 : 2
    let bestValue = maximizingPlayer ? -INFINITY : INFINITY
    
    for (const col of moves) {
      //console.log(`\nTrying move column ${col} for ${currentPlayer === 1 ? 'RED' : 'YELLOW'}`)
      const { row, success } = this.makeMove(board, col, currentPlayer)
      if (!success) {
        //console.log(`Move in column ${col} failed`)
        continue
      }

      const score = this.minimax(board, depth + 1, !maximizingPlayer, suggestion)
      this.undoMove(board, row, col)
      //console.log(`Move column ${col} evaluated to ${score}`)

      if (maximizingPlayer) {
        bestValue = Math.max(bestValue, score)
        //console.log(`RED: Updated best value to ${bestValue}`)
      } else {
        bestValue = Math.min(bestValue, score)
        //console.log(`YELLOW: Updated best value to ${bestValue}`)
      }
    }

    //console.log(`Depth ${depth} returning bestValue: ${bestValue}`)
    return bestValue
  }

  analyzePosition() {
    
    if (this.gameState.currentMoveIndex < 1) {
      return { evaluation: 0, explanation: "Begin Game", alternativeMoves: [] }
    }

    // use currentIndex to get relevant board and player
    const currentPlayer = 1 + (this.gameState.currentMoveIndex % 2)

    // select the board up until currentMoveIndex
    const board = this.gameState.getBoard()

    const moves = MOVE_ORDER.filter(col => board[0][col] === null)
    
    // Clone board for initial evaluation
    // REMEMBER: minimax starts at depth 1

    const boardCopy = board.map(row => [...row])
    const evaluation = this.minimax(boardCopy, 1, currentPlayer !== 1, false)
    
    const alternativeMoves: { column: number; evaluation: number }[] = []
    for (const col of moves) {
      // Clone board for each move evaluation
      const moveBoardCopy = board.map(row => [...row])
      const { row, success } = this.makeMove(moveBoardCopy, col, currentPlayer === 1 ? 2 : 1)
      if (!success) continue
      alternativeMoves.push({ 
        column: col, 
        evaluation: this.minimax(moveBoardCopy, 1, currentPlayer === 1, true) 
      })
    }
    
    let explanation = "Position is equal"
    if (Math.abs(evaluation) > 1000) {  // If it's a forced mate
      const movesToMate = Math.ceil(INFINITY / Math.abs(evaluation))
      explanation = evaluation > 0 ? 
        `Red wins in ${movesToMate-1} moves` : 
        `Yellow wins in ${movesToMate-1} moves`
    } else if (evaluation > 0) {
      explanation = "Advantage for Red"
    } else if (evaluation < 0) {
      explanation = "Advantage for Yellow"
    }

    this.results = { evaluation, explanation, alternativeMoves };
  }
}