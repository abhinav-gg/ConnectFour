import { StandardGame } from './game';
import { GameInfo, Move, TimedMoveResult } from '../../types/game';

export class TimedStandardGame {
  private game: StandardGame;

  private moveTimes: number[] = [];
  private lastMoveTimestamp: number | null = null; // Track last move timestamp for timing
  private timeLeft: [number, number];
  private gameInfo: GameInfo;

  constructor(
    gameInfo:GameInfo, // 5 min in ms
  ) {
    this.game = new StandardGame();
    this.gameInfo = gameInfo;
    // consider verifying the gamemode is standard here in the future
    this.timeLeft = [1000 * (gameInfo.time_control.base_time),
                     1000 * (gameInfo.time_control.base_time + gameInfo.time_control.disadvantage)];
  }

  loadStandard(pTimes: number[], lMove: number, cTurn: number, GameString: string): void {
    // assert pTimes is an array of numbers with length 2
    if (!Array.isArray(pTimes) || pTimes.length !== 2 || !pTimes.every(Number.isFinite)) {
      throw new Error("Invalid move times array");
    }
    this.moveTimes = pTimes;
    this.lastMoveTimestamp = lMove;
    this.game = new StandardGame(GameString);

    // once this is done, assert the current player provided is the game current player
    if (cTurn !== this.game.currentPlayer) {
      throw new Error("Current turn does not match game state");
    }
  }

  makeMove(col: number): TimedMoveResult {

    const now = Date.now();
    const currentPlayer = this.getCurrentPlayer();
    const moveDuration = now - (this.lastMoveTimestamp ?? now); // the first move will have a duration of 0

    if (moveDuration > this.timeLeft[currentPlayer]) {
      // If the move duration exceeds the time left, the player has timed out
      throw new Error("Time's up!");
    }

    const result = this.game.makeMove(col);
    
    if (result.success) {
      this.moveTimes.push(moveDuration);
      this.timeLeft[currentPlayer] += this.gameInfo.time_control.increment * 1000; // Add increment time
      this.timeLeft[currentPlayer] -= moveDuration;
      this.lastMoveTimestamp = now;
    }

    // return a new object with the required TimedMoveResult properties
    return {
      ...result,
      deltaTime: moveDuration,
    };
  }

  reset(): void {
    this.game.reset();
    this.moveTimes = [];
    this.lastMoveTimestamp = Date.now();
    this.timeLeft = [this.gameInfo.time_control.base_time, this.gameInfo.time_control.base_time];
  }

  // Proxy StandardGame methods
  getMoves(): Move[] {
    return this.game.getMoves();
  }

  getBoard() {
    return this.game.getBoard();
  }

  getLegalMoves(): Move[] {
    return this.game.getLegalMoves();
  }

  exportMoves(): string {
    return this.game.exportMoves();
  }

  setMoveIndex(index: number): boolean {
    return this.game.setMoveIndex(index);
  }

  adjMoveIndex(delta: number): boolean {
    return this.game.adjMoveIndex(delta);
  }

  prettyPrintBoard(): string {
    return this.game.prettyPrintBoard();
  }

  get hashCode(): bigint {
    return this.game.hashCode;
  }

  getGameInfo(): GameInfo {
    return this.gameInfo;
  }

  getMoveTimes(): number[] {
    return this.moveTimes;
  }

  getLastMoveTimestamp(): number {
    return this.lastMoveTimestamp ?? -1;
  }

  getTimeLeft(): [number, number] {
    return this.timeLeft;
  }

  getCurrentPlayer(): 0 | 1 {
    return this.game.currentPlayer;
  }

  getCurrentMoveIndex(): number {
    return this.game.currentMoveIndex;
  }

  getWinner() {
    return this.game.winner;
  }

  isGameOver(): boolean {
    return this.game.gameOver;
  }
}
