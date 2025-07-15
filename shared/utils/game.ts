import { EventEmitter } from './eventEmitter';
import { Player, Cell, Move } from '../types/game';
import { ROWS, COLS } from '../constants/game';


export class StandardGame {

  currentPlayer: Player
  currentMoveIndex: number
  winner: Player | null
  gameOver: boolean
  eventEmitter: EventEmitter
  protected board: Cell[][]
  protected moves: Move[]
  
  constructor(movesOrString?: Move[] | string) {

    this.eventEmitter = new EventEmitter();
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    this.gameOver = false;
    this.winner = null;
    this.moves = [];
    this.currentMoveIndex = -1;
    this.currentPlayer = 0; // Start with player 0 (Red)


    if (typeof movesOrString === "string") {

      // first verify that the string contains only digits from 1 to COLS and length <= COLS * ROWS
      if (!/^[1-COLS]+$/.test(movesOrString) || movesOrString.length > ROWS * COLS) {
        throw new Error('Invalid move string.');
      }


      // Parse the string to create moves array
      let moves = movesOrString.split('').map((col, i) => ({
        player: i % 2 as Player,
        col: parseInt(col, 10) - 1 // Convert to 0-based index
      })) as Move[];
      moves.forEach(move => {
        let attempt = this.makeMove(move.col, true); // Silent mode to avoid event emission
        if (!attempt.success) {
          throw new Error(`Invalid move: Column ${move.col} is full or invalid.`);
        }
      });

    } else if (Array.isArray(movesOrString)) {

      movesOrString.forEach(move => {
        // Check for correct player
        if (move.player !== this.currentPlayer) { 
          throw new Error(`Invalid move: Player ${move.player} attempted to play when it's Player ${this.currentPlayer}'s turn.`); 
        }
        if (!this.makeMove(move.col, true).success){ // Silent mode to avoid event emission 
          throw new Error(`Invalid move: Column ${move.col} is full or invalid.`); 
        } 
      });
    }
  }

  getMoves = (): Move[] => {
    return this.moves
  }

  getBoard = (): Cell[][] => {
    return this.board
  }

  getMove = (index: number): Move | null => {
    return this.moves[index] || null
  }

  /**
    * Returns the lowest available row in the specified column.
    * If the column is full, returns -1.
    * @param col - The column index to check (0 to COLS-1).
    * @returns The row index (ROWS-1 to 0) where a piece can be placed (top is 0), or -1 if the column is full.
    */
  getAvailableRow(col: number): number {
    
    let targetRow = ROWS - 1
    while (targetRow >= 0 && this.board[targetRow][col] !== null) {
      targetRow--
    }
    return targetRow
  }

  /**
   * Makes a move in the specified column for the current player.
   * @param col - The column index to place the piece (0 to COLS-1).
   * @param silent - If true, does not emit any events.
   * @returns An object containing the row index where the piece was placed and a success flag.
   * @throws Error if the current move index is not the last move or if the game is already over.
   */
  makeMove(col: number, silent = false): { row: number; success: boolean } {

    if (this.currentMoveIndex != this.moves.length - 1) {
      // If the current move index is not the last move, reset the moves array
      throw new Error('Cannot make a move when the current move index is not the last move.');
    } else if (this.gameOver) {
      // If the game is already over, do not allow further moves
      //throw new Error('Cannot make a move when the game is already over.');
      return { row: -1, success: false }; // Return failure silently
    }
    
    const targetRow = this.getAvailableRow(col)
    if (targetRow >= 0) {
      this.board[targetRow][col] = this.currentPlayer
      this.moves.push({ player: this.currentPlayer, col })
      this.currentPlayer = this.currentPlayer === 1 ? 0 : 1
      this.currentMoveIndex ++;
      this.checkGameOver(targetRow, col); // Check if the move results in a win or draw

      if (!silent) {
        if (!this.gameOver) {
          this.eventEmitter.pub('boardUpdated', { row: targetRow, col, player: this.currentPlayer });
        } else {
          this.eventEmitter.pub('gameEnded', this.winner);
        }
      }
      
      return { row: targetRow, success: true }
    }
    
    return { row: -1, success: false }
  }

  get hashCode(): bigint {
    
    // for each column, get the topmost row that is not null
    let hash = 0n;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        let cell = this.board[row][col];
        let intToAdd = 0n;
        if (cell) {
          intToAdd = BigInt(cell)
        }
        hash = (hash << BigInt(1)) | intToAdd; // Shift left by a bit for each cell
      }
    }

    for (let i = 0; i < COLS; i++) {
      hash = (hash << BigInt(3)) | BigInt(this.getAvailableRow(i) + 1); // Shift left by 3 bits for each column's available row
    }
    
    return hash;
  }

  adjMoveIndex = (deltaIndex: number): boolean => {
    let newInd = this.currentMoveIndex + deltaIndex
    return this.setMoveIndex(newInd);
  }

  setMoveIndex = (newMoveIndex: number): boolean => {
    /**.
      * Sets the current move index to the new move index and updates the board
      * @param newMoveIndex - The new move index to check.
      * @returns {boolean} - True if successful.
    */

    if (newMoveIndex < 0 || newMoveIndex >= this.moves.length) {
      return false;
    }

    this.currentMoveIndex = newMoveIndex
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    this.moves.forEach(element => {
      
      // moveIndex is valid so construct without any checks
      this.board[this.getAvailableRow(element.col)][element.col] = element.player;

    });
    
    return true
  }

  exportMoves(): string {
    return this.moves.map(({ player, col }) => col).join('')
  }

  reset(): void {
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    this.currentPlayer = 0
    this.currentMoveIndex = -1
    this.winner = null
    this.gameOver = false
    this.moves = []
  }

  checkGameOver(row: number, col: number) {

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
      
    // Check for draw (full top row)
    if (this.board[0].every(cell => cell !== null)) {
      this.gameOver = true
      return true
    }

    return false
  }

  prettyPrintBoard(): string { // used for debugging and testing
    let output = ''
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = this.board[row][col]
        output += cell === null ? '.' : (cell === 0 ? 'R' : 'Y')
      }
      output += '\n'
    }
    return output
  }


}
