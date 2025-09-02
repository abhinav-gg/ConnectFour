import { StandardGame } from './game';
import { NavigableGame } from '@shared/types/game.types';
import { Move, Player, Cell } from '../../types/game.types';
import { ROWS, COLS } from '@shared/constants/game.constants';

export class HistoryStandardGame extends StandardGame implements NavigableGame {
  protected currentMoveIndex: number = -1;

  constructor(movesOrString?: Move[] | string) {
    super(movesOrString);
    this.currentMoveIndex = this.moves.length - 1;
  }

  /**
   * Makes a move in the specified column for the current player.
   * @param col - The column index to place the piece (0 to COLS-1).
   * @returns An object containing the row index where the piece was placed and a success flag.
   * @throws Error if the current move index is not the last move or if the game is already over.
   */
  makeMove(col: number): { row: number; success: boolean } {
    if (this.currentMoveIndex !== this.moves.length - 1) {
      // If the current move index is not the last move, cannot make a new move
      throw new Error('Cannot make a move when the current move index is not the last move.');
    }

    const result = super.makeMove(col);
    if (result.success) {
      this.currentMoveIndex++;
    }
    return result;
  }

  /**
   * Sets the current move index to the new move index and updates the board
   * @param newMoveIndex - The new move index to set (-1 for initial position).
   * @returns {boolean} - True if successful.
   */
  setMoveIndex(newMoveIndex: number): boolean {
    if (newMoveIndex < -1 || newMoveIndex >= this.moves.length) {
      return false;
    }

    this.currentMoveIndex = newMoveIndex;
    return true;
  }

  /**
   * Adjusts the current move index by the specified delta
   * @param deltaIndex - The delta to apply to current move index
   * @returns {boolean} - True if successful.
   */
  adjMoveIndex(deltaIndex: number): boolean {
    return this.setMoveIndex(this.currentMoveIndex + deltaIndex);
  }

  // instead of rebuilding, just update the getBoard method to use index
  getBoard = (): Cell[][] => {
    const boardCopy = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    
    // Rebuild the board state progressively up to currentMoveIndex
    for (let i = 0; i <= this.currentMoveIndex; i++) {
      const col = this.moves[i];
      
      // Find the lowest available row in this column based on current board state
      let targetRow = ROWS - 1;
      while (targetRow >= 0 && boardCopy[targetRow][col] !== null) {
        targetRow--;
      }
      
      if (targetRow >= 0) {
        boardCopy[targetRow][col] = i % 2 === 0 ? 0 : 1; // Alternate players
      }
    }
    
    return boardCopy;
  }

  /**
   * Export moves only up to the current move index
   */
  exportMoves(): string {
    return this.getMoves().map((col) => col + 1).join('');
  }

  /**
   * Export moves only up to the current move index
   */
  getMoves = (): number[] => {
    return this.moves.slice(0, this.currentMoveIndex + 1);
  }

  /**
   * Export moves only up to the current move index
   */
  getAllMoves = (): number[] => {
    return this.moves;
  }

  /**
   * Get the current move index
   */
  getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }

  /**
   * Reset the game and move index
   */
  reset(): void {
    super.reset();
    this.currentMoveIndex = -1;
  }

  /**
   * Load moves and set current index to the end
   */
  load(movesOrString: Move[] | string): void {
    super.load(movesOrString);
    this.currentMoveIndex = this.moves.length - 1;
  }
}
