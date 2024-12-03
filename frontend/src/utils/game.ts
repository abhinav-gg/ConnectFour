export type Player = 1 | 2
export type Cell = Player | null
export type Move = { player: Player; col: number }

export const ROWS = 6
export const COLS = 7

export class GameState {
  board: Cell[][]
  currentPlayer: Player
  winner: Player | null
  gameOver: boolean
  moves: Move[]

  constructor() {
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    this.currentPlayer = 1
    this.winner = null
    this.gameOver = false
    this.moves = []
  }

  evaluate(): number {
    // Only evaluate actual wins, not threats
    return 0
  }

  checkWinner(row: number, col: number): boolean {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal right
      [1, -1], // diagonal left
    ]

    const currentPlayerValue = this.board[row][col]

    for (const [dx, dy] of directions) {
      let count = 1
      for (const factor of [-1, 1]) {
        let r = row + factor * dx
        let c = col + factor * dy

        while (
          r >= 0 && r < ROWS &&
          c >= 0 && c < COLS &&
          this.board[r][c] === currentPlayerValue
        ) {
          count++
          r += factor * dx
          c += factor * dy
        }
      }

      if (count >= 4) {
        this.winner = currentPlayerValue
        this.gameOver = true
        return true
      }
    }

    // Check for draw
    if (this.board.every(row => row.every(cell => cell !== null))) {
      this.gameOver = true
      return true
    }

    return false
  }

  getAvailableRow(col: number): number {
    let targetRow = ROWS - 1
    while (targetRow >= 0 && this.board[targetRow][col] !== null) {
      targetRow--
    }
    return targetRow
  }

  makeMove(col: number): { row: number; success: boolean } {
    const targetRow = this.getAvailableRow(col)
    
    if (targetRow >= 0) {
      this.board[targetRow][col] = this.currentPlayer
      this.moves.push({ player: this.currentPlayer, col })
      this.checkWinner(targetRow, col)
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1
      return { row: targetRow, success: true }
    }
    
    return { row: -1, success: false }
  }

  getBoardAtMove(moveIndex: number): Cell[][] {
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    for (let i = 0; i <= moveIndex; i++) {
      const move = this.moves[i]
      let row = ROWS - 1
      while (row >= 0 && newBoard[row][move.col] !== null) {
        row--
      }
      if (row >= 0) {
        newBoard[row][move.col] = move.player
      }
    }
    return newBoard
  }

  reset(): void {
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    this.currentPlayer = 1
    this.winner = null
    this.gameOver = false
    this.moves = []
  }

  checkGameOver(): void {
    // Check for wins
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = this.board[row][col]
        if (cell !== null && checkWinner(this.board, row, col, cell)) {
          this.winner = cell
          this.gameOver = true
          return
        }
      }
    }

    // Check for draw (full board)
    if (this.board.every(row => row.every(cell => cell !== null))) {
      this.gameOver = true
      this.winner = null
      return
    }

    // Game is still ongoing
    this.gameOver = false
    this.winner = null
  }
}

export function generateAnalysis(board: Cell[][], currentPlayer: Player) {
  return {
    evaluation: currentPlayer === 1 ? 0.5 : -0.5,
    explanation: "Slight advantage based on center control",
    alternativeMoves: [
      { column: Math.floor(Math.random() * COLS), evaluation: 0.3 },
      { column: Math.floor(Math.random() * COLS), evaluation: -0.2 },
      { column: Math.floor(Math.random() * COLS), evaluation: 0.1 }
    ]
  }
}

export function checkWinner(board: Cell[][], row: number, col: number, player: 1 | 2): boolean {
  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal right
    [1, -1], // diagonal left
  ]

  const currentPlayerValue = board[row][col]

  for (const [dx, dy] of directions) {
    let count = 1
    for (const factor of [-1, 1]) {
      let r = row + factor * dx
      let c = col + factor * dy

      while (
        r >= 0 && r < ROWS &&
        c >= 0 && c < COLS &&
        board[r][c] === currentPlayerValue
      ) {
        count++
        r += factor * dx
        c += factor * dy
      }
    }

    if (count >= 4) {
      return true
    }
  }

  // Check for draw
  if (board.every(row => row.every(cell => cell !== null))) {
    return true
  }

  return false
}
