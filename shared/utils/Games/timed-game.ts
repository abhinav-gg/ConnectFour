import { StandardGame } from './game';
import { GameInfo, Move, Player, TimedMoveResult } from '../../types/game';
import { GameState } from '@shared/constants/allgamestates';

export class TimedStandardGame {
  private game: StandardGame;

  private lastMoveTimestamp: number | null = null; // Track last move timestamp for timing
  private timeLeft: [number, number];
  private gameInfo: GameInfo;
  private timedOutPlayer: Player | null = null; // Track if a player has timed out

  constructor(
    gameInfo:GameInfo, // 5 min in ms
  ) {
    this.game = new StandardGame();
    this.gameInfo = gameInfo;
    // consider verifying the gamemode is standard here in the future
    this.timeLeft = [1000 * (gameInfo.time_control.base_time),
                     1000 * (gameInfo.time_control.base_time + gameInfo.time_control.disadvantage)];
  }

  loadStandard(pTimes: number[], lMove: number, cTurn: number, GameString: number[]): void {
    // assert pTimes is an array of numbers with length 2
    if (!Array.isArray(pTimes) || pTimes.length !== 2 || !pTimes.every(Number.isFinite)) {
      throw new Error("Invalid move times array");
    }
    this.timeLeft = pTimes as [number, number];
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

    if (this.checkPlayerTimeOut()) {
      return {
        success: false,
      };
    }

    const result = this.game.makeMove(col);
    
    if (result.success) {
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


  checkPlayerTimeOut(): boolean {
    const now = Date.now();
    const moveDuration = now - (this.lastMoveTimestamp ?? now); // the first move will have a duration of 0

    if (moveDuration > this.timeLeft[this.game.currentPlayer]) {
      console.log(`Player ${this.game.currentPlayer} timed out after ${moveDuration}ms`);
      this.game.winner = this.game.currentPlayer === 0 ? 1 : 0; // Set the opponent as the winner
      this.game.gameOver = true;
      this.timedOutPlayer = this.game.currentPlayer; // Track the timed out player
      return true;
    }

    return false;
  }


  reset(): void {
    this.game.reset();
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

  getGameState(): GameState {
   
    if (!this.game.gameOver) {
      return GameState.IN_PROGRESS;
    }
    
    if (this.timedOutPlayer != null) {
      return this.timedOutPlayer === 0 ? GameState.RED_TIMEOUT : GameState.YELLOW_TIMEOUT;
    }

    if (this.game.winner === null) {
      return GameState.DRAW_FULL;
    }

    return this.game.winner === 0 ? GameState.RED_WIN : GameState.YELLOW_WIN;

  }

  isGameOver(): boolean {
    return this.game.gameOver;
  }

  hasTimedOutPlayer(): boolean {
    return this.timedOutPlayer !== null;
  }


}
