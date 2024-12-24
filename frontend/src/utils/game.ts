import { eventEmitter } from './eventEmitter';

export type Player = 1 | 2
export type Cell = Player | null
export type Move = { player: Player; col: number }

export const ROWS = 6
export const COLS = 7

export function removeEventListener(listener: EventListener) {
  // remove listener from the event
}

export class GameState {
  currentPlayer: Player
  currentMoveIndex: number
  winner: Player | null
  gameOver: boolean
  /**
   * array of rows, each row is an array of cells
   */
  private board: Cell[][]
  private moves: Move[]

  constructor() {
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    this.currentPlayer = 1
    this.currentMoveIndex = -1 // used for animation synchronization
    this.winner = null
    this.gameOver = false
    this.moves = []
  }

  getControlOfZugzwang(): Player|null {
    const heights = Array(COLS).fill(0)
    const otherPlayer = this.currentPlayer === 1 ? 2 : 1
    for (let col = 0; col < COLS; col++) {
      heights[col] = this.getAvailableRow(col)
      if (heights[col] === -1) {
        continue
      }
      if (checkWinner(this.board, heights[col], col, otherPlayer)) {
        heights[col] = -1
      }
    }
    const parities = heights.filter((height) => (height!==-1)).map((height) => height % 2)
    if (parities.length === 1) {
      return null
    }
    else if (parities.every((i) => (i === 1)) || parities.every((i) => (i === 0))) {
      return otherPlayer
    } 
    else if (parities.length < 4) {
      return this.currentPlayer
    }
    return null
  }

  evaluate(): number {
    let score = 0;
    const modifier = 2 * this.currentPlayer - 3
    const y = this.getControlOfZugzwang()
    if (y) {
      score = 2 * y - 3;
    }
    let winner;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (this.board[row][col] !== null) {
          continue
        }
        winner = checkWinner(this.board, row, col, 1)
        if (winner) {
          if (row % 2 === 0) {
            score += 1
          }
          else {
            score += 0.5
          }
        }
        winner = checkWinner(this.board, row, col, 2)
        if (winner) {
          if (row % 2 === 1) {
            score -= 1
          }
          else {
            score -= 0.5
          }
        }
      }
    }
    

    return score
  }

  getMoves = (): Move[] => {
    return this.moves
  }

  getMove = (index: number): Move | null => {
    return this.moves[index] || null
  }

  addMove = (move: Move) => {
    // add move to moves
    this.moves.push(move)
    // emit boardUpdated event
    eventEmitter.emit('boardUpdated', { row: -1, col: move.col, player: this.currentPlayer });
  }

  getBoard = (): Cell[][] => {
    return this.board
  }

  setBoard = (board: Cell[][], silent: boolean = false) => {
    // avoid use at all costs
    if (!silent)
      eventEmitter.emit('boardSet', { row: -1, col: -1, player: this.currentPlayer });
    this.board = board
  }

  constructFromMoves() {
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    for (let i = 0; i < Math.min(this.moves.length, this.currentMoveIndex + 1); i++) {
      const move = this.moves[i]
      let row = ROWS - 1
      while (row >= 0 && this.board[row][move.col] !== null) {
        row--
      }
      if (row >= 0) {
        this.board[row][move.col] = move.player
      }
    }
    const lastCol = this.moves.length > 0 ? this.moves[this.moves.length - 1].col : -1;
    eventEmitter.emit('boardSet', { row: -1, col: lastCol, player: this.currentPlayer });
  }

  getAvailableRow(col: number): number {
    let targetRow = ROWS - 1
    while (targetRow >= 0 && this.board[targetRow][col] !== null) {
      targetRow--
    }
    return targetRow
  }

  makeMove(col: number): { row: number; success: boolean } {
    
    console.log(this.getControlOfZugzwang())

    const targetRow = this.getAvailableRow(col)
    // ensure that the board reflects all the moves made i.e. not in history view
    // count non-empty cells in board
    let nonEmptyCells = 0;
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        if (this.board[i][j] !== null) {
          nonEmptyCells++;
        }
      }
    }
    if (nonEmptyCells < this.moves.length) {
      return { row: -1, success: false }
    }

    if (targetRow >= 0) {
      this.board[targetRow][col] = this.currentPlayer
      this.moves.push({ player: this.currentPlayer, col })
      this.checkGameOver()
      if (this.gameOver) {
        this.endGame(this.winner)
      }
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1

      // Call boardUpdated event!
      this.currentMoveIndex++;
      eventEmitter.emit('boardUpdated', { row: targetRow, col, player: this.currentPlayer });

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

  exportMoves(): string {
    return this.moves.map(({ player, col }) => col).join('')
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
      this.winner = null
      this.gameOver = true
      return
    }

    // Game is still ongoing
    this.gameOver = false
    this.winner = null
  }

  // Call this method when the game ends
  endGame(winner: Player | null) {
    this.gameOver = true;
    this.winner = winner;
    eventEmitter.emit('gameEnded', winner);
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
  return false
}
