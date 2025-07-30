import { StandardGame } from './game';
import { GameInfo, Move } from '../../types/game';

export class TimedStandardGame {
  private game: StandardGame;

  private moveTimes: number[] = [];
  private lastMoveTimestamp: number;
  private timeLeft: [number, number];
  private gameInfo: GameInfo;

  constructor(
    gameInfo:GameInfo, // 5 min in ms
    movesOrString?: Move[] | string,
  ) {
    this.game = new StandardGame(movesOrString);
    this.gameInfo = gameInfo;
    this.timeLeft = [gameInfo.time_control.base_time, gameInfo.time_control.base_time];
    this.lastMoveTimestamp = Date.now(); // Start clock immediately
  }

  makeMove(col: number): { row: number; success: boolean } {
    const now = Date.now();
    const currentPlayer = this.getCurrentPlayer();
    const moveDuration = now - this.lastMoveTimestamp;

    const result = this.game.makeMove(col);

    if (result.success) {
      this.moveTimes.push(moveDuration);
      this.timeLeft[currentPlayer] -= moveDuration;
      this.lastMoveTimestamp = now;
    }

    return result;
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
    return this.lastMoveTimestamp;
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
