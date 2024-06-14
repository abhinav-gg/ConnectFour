import { writable } from 'svelte/store';

export enum CellState {
  Empty,
  Player1,
  Player2,
}

enum GameState {
  InProgress,
  Player1Win,
  Player2Win,
  Draw
}

type Grid = CellState[][];

export class Game {
  private _currentPlayer = 0;
  private readonly _lowestCellIndices: number[] = Array(7).fill(5);
  private readonly _grid: Grid = Array(7)
    .fill(0)
    .map(() => Array(6).fill(CellState.Empty));
  private readonly _lastMove = [-1, -1];
  private readonly _moves: number[] = [];

  public gameState = writable({
    currentPlayer: this._currentPlayer,
    lowestCellIndices: this._lowestCellIndices,
    grid: this._grid,
    lastMove: this._lastMove,
    moves: this._moves,
  });

  constructor() { }

  private switchPlayer() {
    this._currentPlayer = this._currentPlayer === 0 ? 1 : 0;
    this.gameState.update((state) => ({ ...state, currentPlayer: this._currentPlayer }));
  }

  private updateLowestCellIndex(i: number) {
    this._lowestCellIndices[i] = Math.max(0, this._lowestCellIndices[i] - 1);
    this.gameState.update((state) => ({ ...state, lowestCellIndices: this._lowestCellIndices }));
  }

  public captureCell(col: number) {
    const lowestCell = this._lowestCellIndices[col];
    if (lowestCell < 0) return;

    const cell = this._grid[col][lowestCell];
    if (cell !== CellState.Empty) return;

    this._grid[col][lowestCell] =
      this._currentPlayer === 0 ? CellState.Player1 : CellState.Player2;
    this.gameState.update((state) => ({ ...state, grid: this._grid }));

    this._lastMove[0] = col;
    this._lastMove[1] = lowestCell;
    this.gameState.update((state) => ({ ...state, lastMove: this._lastMove }));

    this._moves.push(col + 1); // 1-7 instead of 0-6
    this.gameState.update((state) => ({ ...state, moves: this._moves }));

    this.updateLowestCellIndex(col);
    this.switchPlayer();
  }
}