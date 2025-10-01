# Backend Tools & Utilities Documentation

## Overview

The tools directory contains specialized utilities, game analysis tools, AI bot implementations, and development helpers that support the core ConnectFour application functionality.

## Architecture

```
tools/
├── gameReview.ts         # Game analysis and review tools
├── old_analysis.ts       # Legacy analysis implementations
├── opening-book.ts       # Opening move database and analysis
├── victor.ts             # Victor bot implementation (legacy)
└── Bots/                 # AI bot implementations
    ├── index.ts          # Bot registry and management
    ├── bot.ts            # Base bot class and interfaces
    ├── randomBot.ts      # Random move bot
    ├── adaptiveBot.ts    # Learning/adaptive bot
    ├── beginnerBot.ts    # Beginner difficulty bot
    ├── intermediateBot.ts # Intermediate difficulty bot
    ├── expertBot.ts      # Expert difficulty bot
    ├── victorBot.ts      # Victor competitive bot
    ├── goatnus.ts        # Advanced strategic bot
    └── perfectBot.ts     # Perfect play bot
```

## Game Analysis Tools (`gameReview.ts`)

### Purpose
Provides post-game analysis, move evaluation, and strategic insights for completed games.

### Key Functions

#### `analyzeGame(gameData: CompleteGameData)`
```typescript
interface GameAnalysis {
  moves: MoveAnalysis[];
  playerStats: PlayerAnalysis[];
  openingClassification: OpeningInfo;
  criticalMoments: CriticalMoment[];
  winProbabilityChart: WinProbability[];
  recommendations: string[];
}

export async function analyzeGame(gameData: CompleteGameData): Promise<GameAnalysis> {
  const analysis: GameAnalysis = {
    moves: [],
    playerStats: [],
    openingClassification: classifyOpening(gameData.moves),
    criticalMoments: [],
    winProbabilityChart: [],
    recommendations: [],
  };
  
  // Analyze each move
  for (let i = 0; i < gameData.moves.length; i++) {
    const moveAnalysis = await analyzeSingleMove(gameData, i);
    analysis.moves.push(moveAnalysis);
    
    // Track win probability changes
    analysis.winProbabilityChart.push({
      moveNumber: i + 1,
      probability: moveAnalysis.winProbability,
    });
    
    // Identify critical moments
    if (moveAnalysis.isBlunder || moveAnalysis.isBrilliant) {
      analysis.criticalMoments.push({
        moveNumber: i + 1,
        type: moveAnalysis.isBlunder ? 'blunder' : 'brilliant',
        description: moveAnalysis.comment,
        impactOnWinProbability: moveAnalysis.probabilityChange,
      });
    }
  }
  
  // Generate player statistics
  analysis.playerStats = generatePlayerStatistics(gameData, analysis.moves);
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);
  
  return analysis;
}
```

#### `analyzeSingleMove(gameData: CompleteGameData, moveIndex: number)`
```typescript
interface MoveAnalysis {
  column: number;
  player: number;
  isBlunder: boolean;
  isBrilliant: boolean;
  accuracy: number;
  winProbability: number;
  probabilityChange: number;
  bestMoves: AlternativeMove[];
  comment: string;
  tactical: TacticalInfo;
}

async function analyzeSingleMove(gameData: CompleteGameData, moveIndex: number): Promise<MoveAnalysis> {
  const move = gameData.moves[moveIndex];
  const boardBefore = reconstructBoardState(gameData.moves.slice(0, moveIndex));
  const boardAfter = reconstructBoardState(gameData.moves.slice(0, moveIndex + 1));
  
  // Calculate win probability before and after move
  const probBefore = calculateWinProbability(boardBefore, move.player);
  const probAfter = calculateWinProbability(boardAfter, 1 - move.player);
  
  // Find best alternative moves
  const bestMoves = await findBestMoves(boardBefore, move.player, 3);
  
  // Evaluate move quality
  const accuracy = evaluateMoveAccuracy(move.column, bestMoves);
  const isBlunder = accuracy < 0.3 && Math.abs(probAfter - probBefore) > 0.3;
  const isBrilliant = accuracy > 0.95 && (probAfter - probBefore) > 0.2;
  
  // Analyze tactical elements
  const tactical = analyzeTacticalElements(boardBefore, boardAfter, move);
  
  return {
    column: move.column,
    player: move.player,
    isBlunder,
    isBrilliant,
    accuracy,
    winProbability: probAfter,
    probabilityChange: probAfter - probBefore,
    bestMoves,
    comment: generateMoveComment(move, accuracy, tactical),
    tactical,
  };
}
```

### Analysis Features
- **Move Accuracy**: Rate each move against optimal play
- **Win Probability**: Track win chances throughout the game
- **Tactical Analysis**: Identify threats, blocks, and combinations
- **Opening Classification**: Categorize opening strategies
- **Critical Moments**: Highlight game-changing moves
- **Performance Metrics**: Player-specific statistics

## Opening Book (`opening-book.ts`)

### Purpose
Database of opening moves, patterns, and strategic recommendations for game starts.

### Opening Database
```typescript
interface OpeningMove {
  column: number;
  name: string;
  description: string;
  winRate: number;
  popularity: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  variations: OpeningVariation[];
}

interface OpeningVariation {
  moves: number[];
  name: string;
  evaluation: number; // -1 to 1, where 1 is best for first player
  mainLine: boolean;
  notes: string;
}

export const OPENING_BOOK: Record<string, OpeningMove> = {
  center: {
    column: 3,
    name: "Center Opening",
    description: "The most common and balanced opening move",
    winRate: 0.52,
    popularity: 0.45,
    difficulty: 'beginner',
    variations: [
      {
        moves: [3, 3, 2, 4],
        name: "Center Control",
        evaluation: 0.1,
        mainLine: true,
        notes: "Maintains central control with balanced development"
      },
      {
        moves: [3, 2, 3, 4],
        name: "Center-Left Response",
        evaluation: 0.05,
        mainLine: false,
        notes: "Solid response avoiding immediate confrontation"
      }
    ]
  },
  
  left: {
    column: 2,
    name: "Left Opening", 
    description: "Aggressive opening targeting left side control",
    winRate: 0.48,
    popularity: 0.25,
    difficulty: 'intermediate',
    variations: [
      {
        moves: [2, 3, 1, 4],
        name: "Left Flank Attack",
        evaluation: -0.05,
        mainLine: true,
        notes: "Creates early pressure on the left side"
      }
    ]
  },
  
  right: {
    column: 4,
    name: "Right Opening",
    description: "Mirror of left opening, right side focus",
    winRate: 0.48,
    popularity: 0.25,
    difficulty: 'intermediate',
    variations: [
      {
        moves: [4, 3, 5, 2],
        name: "Right Flank Attack",
        evaluation: -0.05,
        mainLine: true,
        notes: "Creates early pressure on the right side"
      }
    ]
  }
};
```

### Opening Analysis Functions
```typescript
export function classifyOpening(moves: GameMove[]): OpeningInfo {
  if (moves.length === 0) return { name: "Unknown", classification: "none" };
  
  const firstMove = moves[0];
  const openingKey = getOpeningKey(firstMove.column);
  const opening = OPENING_BOOK[openingKey];
  
  if (!opening) return { name: "Irregular", classification: "irregular" };
  
  // Try to match variations
  const matchedVariation = findMatchingVariation(opening, moves.slice(0, 8));
  
  return {
    name: opening.name,
    classification: opening.difficulty,
    variation: matchedVariation?.name,
    evaluation: matchedVariation?.evaluation || 0,
    description: opening.description,
  };
}

export function getOpeningRecommendation(boardState: number[][], player: number): OpeningMove | null {
  const moveCount = countTotalMoves(boardState);
  
  if (moveCount >= 8) return null; // Past opening phase
  
  const gameHistory = reconstructMoveHistory(boardState);
  const possibleMoves = getValidColumns(boardState);
  
  // Find best opening continuation
  let bestMove: OpeningMove | null = null;
  let bestScore = -Infinity;
  
  for (const column of possibleMoves) {
    const hypotheticalHistory = [...gameHistory, { column, player }];
    const score = evaluateOpeningSequence(hypotheticalHistory);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = createOpeningMove(column, hypotheticalHistory);
    }
  }
  
  return bestMove;
}
```

## Bot System (`Bots/`)

### Bot Registry (`index.ts`)
```typescript
export const botRegistry = new Map<string, typeof BotBase>([
  ['random', RandomBot],
  ['adaptive', AdaptiveBot], 
  ['beginner', BeginnerBot],
  ['intermediate', IntermediateBot],
  ['expert', ExpertBot],
  ['victor', VictorBot],
  ['goatnus', GoatnusBot],
  ['perfect', PerfectBot],
]);

export function getBotById(botId: string, game: TimedStandardGame): BotBase {
  const BotClass = botRegistry.get(botId);
  if (!BotClass) {
    throw new Error(`Bot with ID "${botId}" not found`);
  }
  return new BotClass(game);
}

export function isValidBotId(botId: string): boolean {
  return botRegistry.has(botId);
}

export function getAllBots(): BotType[] {
  return Bots; // From shared constants
}
```

### Base Bot Class (`bot.ts`)
```typescript
export abstract class BotBase {
  protected game: TimedStandardGame;
  protected difficulty: string;
  protected thinkingTime: number;
  
  constructor(game: TimedStandardGame, difficulty: string = 'unknown') {
    this.game = game;
    this.difficulty = difficulty;
    this.thinkingTime = this.calculateThinkingTime();
  }
  
  abstract chooseMove(): Promise<number>;
  
  protected getValidMoves(): number[] {
    return this.game.getValidMoves();
  }
  
  protected isWinningMove(column: number): boolean {
    const tempGame = this.game.clone();
    tempGame.makeMove(column);
    return tempGame.checkWinCondition() !== null;
  }
  
  protected isBlockingMove(column: number): boolean {
    const tempGame = this.game.clone();
    tempGame.makeMove(column); // Opponent's hypothetical move
    return tempGame.checkWinCondition() !== null;
  }
  
  protected evaluatePosition(): number {
    // Base evaluation function
    return 0;
  }
  
  protected calculateThinkingTime(): number {
    // Simulate realistic thinking time based on difficulty
    const baseTime = 500; // 500ms base
    const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 to 1.25x
    return Math.floor(baseTime * randomFactor);
  }
  
  protected async simulateThinking(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.thinkingTime));
  }
}
```

### Specific Bot Implementations

#### Random Bot (`randomBot.ts`)
```typescript
export class RandomBot extends BotBase {
  constructor(game: TimedStandardGame) {
    super(game, 'random');
  }
  
  async chooseMove(): Promise<number> {
    await this.simulateThinking();
    
    const validMoves = this.getValidMoves();
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    
    return validMoves[randomIndex];
  }
}
```

#### Expert Bot (`expertBot.ts`)
```typescript
export class ExpertBot extends BotBase {
  private readonly MAX_DEPTH = 8;
  private readonly EVALUATION_CACHE = new Map<string, number>();
  
  constructor(game: TimedStandardGame) {
    super(game, 'expert');
  }
  
  async chooseMove(): Promise<number> {
    await this.simulateThinking();
    
    const validMoves = this.getValidMoves();
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    
    // Check for immediate wins
    for (const move of validMoves) {
      if (this.isWinningMove(move)) {
        return move;
      }
    }
    
    // Check for necessary blocks
    for (const move of validMoves) {
      if (this.isBlockingMove(move)) {
        return move;
      }
    }
    
    // Use minimax with alpha-beta pruning
    for (const move of validMoves) {
      const tempGame = this.game.clone();
      tempGame.makeMove(move);
      
      const score = this.minimax(tempGame, this.MAX_DEPTH - 1, -Infinity, Infinity, false);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  private minimax(game: TimedStandardGame, depth: number, alpha: number, beta: number, maximizing: boolean): number {
    // Check cache
    const gameState = game.serialize();
    const cacheKey = `${gameState}-${depth}-${maximizing}`;
    if (this.EVALUATION_CACHE.has(cacheKey)) {
      return this.EVALUATION_CACHE.get(cacheKey)!;
    }
    
    // Terminal conditions
    const result = game.checkWinCondition();
    if (result !== null || depth === 0) {
      const evaluation = this.evaluatePosition(game, result);
      this.EVALUATION_CACHE.set(cacheKey, evaluation);
      return evaluation;
    }
    
    const validMoves = game.getValidMoves();
    
    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of validMoves) {
        const tempGame = game.clone();
        tempGame.makeMove(move);
        const eval = this.minimax(tempGame, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      this.EVALUATION_CACHE.set(cacheKey, maxEval);
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of validMoves) {
        const tempGame = game.clone();
        tempGame.makeMove(move);
        const eval = this.minimax(tempGame, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      this.EVALUATION_CACHE.set(cacheKey, minEval);
      return minEval;
    }
  }
  
  private evaluatePosition(game: TimedStandardGame, result: any): number {
    if (result?.winner === this.game.getCurrentPlayer()) return 1000;
    if (result?.winner !== null) return -1000;
    if (result?.isDraw) return 0;
    
    // Positional evaluation
    const board = game.getBoard();
    let score = 0;
    
    // Center preference
    const centerColumns = [2, 3, 4];
    for (const col of centerColumns) {
      for (let row = 0; row < board.length; row++) {
        if (board[row][col] === this.game.getCurrentPlayer()) {
          score += (col === 3) ? 4 : 2; // Center column bonus
        }
      }
    }
    
    // Threat analysis
    score += this.analyzeThreatPatterns(board) * 10;
    
    return score;
  }
  
  private analyzeThreatPatterns(board: number[][]): number {
    // Analyze potential winning patterns
    let threatScore = 0;
    
    // Check all possible 4-in-a-row positions
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical  
      [1, 1],   // Diagonal \
      [1, -1],  // Diagonal /
    ];
    
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[0].length; col++) {
        for (const [dr, dc] of directions) {
          const pattern = this.getPattern(board, row, col, dr, dc, 4);
          threatScore += this.evaluatePattern(pattern);
        }
      }
    }
    
    return threatScore;
  }
  
  private getPattern(board: number[][], startRow: number, startCol: number, dr: number, dc: number, length: number): number[] {
    const pattern: number[] = [];
    
    for (let i = 0; i < length; i++) {
      const row = startRow + i * dr;
      const col = startCol + i * dc;
      
      if (row < 0 || row >= board.length || col < 0 || col >= board[0].length) {
        pattern.push(-1); // Out of bounds
      } else {
        pattern.push(board[row][col]);
      }
    }
    
    return pattern;
  }
  
  private evaluatePattern(pattern: number[]): number {
    const player = this.game.getCurrentPlayer();
    const opponent = 1 - player;
    
    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;
    
    for (const cell of pattern) {
      if (cell === player) playerCount++;
      else if (cell === opponent) opponentCount++;
      else if (cell === 0) emptyCount++;
    }
    
    // Pattern is blocked if both players have pieces
    if (playerCount > 0 && opponentCount > 0) return 0;
    
    // Score based on potential
    if (playerCount === 3 && emptyCount === 1) return 50;  // One move to win
    if (playerCount === 2 && emptyCount === 2) return 10;  // Two moves to win
    if (playerCount === 1 && emptyCount === 3) return 1;   // Three moves to win
    
    if (opponentCount === 3 && emptyCount === 1) return -50; // Must block
    if (opponentCount === 2 && emptyCount === 2) return -10; // Should block
    
    return 0;
  }
}
```

#### Perfect Bot (`perfectBot.ts`)
```typescript
export class PerfectBot extends BotBase {
  private readonly transpositionTable = new Map<string, { score: number; depth: number; flag: string }>();
  private readonly openingBook = new Map<string, number>();
  
  constructor(game: TimedStandardGame) {
    super(game, 'perfect');
    this.initializeOpeningBook();
  }
  
  async chooseMove(): Promise<number> {
    await this.simulateThinking();
    
    const gameState = this.game.serialize();
    
    // Check opening book
    if (this.openingBook.has(gameState)) {
      return this.openingBook.get(gameState)!;
    }
    
    // Use perfect solver algorithm
    const validMoves = this.getValidMoves();
    let bestMove = validMoves[0];
    let bestScore = -Infinity;
    
    for (const move of validMoves) {
      const tempGame = this.game.clone();
      tempGame.makeMove(move);
      
      const score = this.negamax(tempGame, 42, -Infinity, Infinity); // Full depth
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  private negamax(game: TimedStandardGame, depth: number, alpha: number, beta: number): number {
    const gameState = game.serialize();
    
    // Check transposition table
    const entry = this.transpositionTable.get(gameState);
    if (entry && entry.depth >= depth) {
      if (entry.flag === 'EXACT') return entry.score;
      if (entry.flag === 'LOWERBOUND') alpha = Math.max(alpha, entry.score);
      if (entry.flag === 'UPPERBOUND') beta = Math.min(beta, entry.score);
      if (alpha >= beta) return entry.score;
    }
    
    // Terminal node evaluation
    const result = game.checkWinCondition();
    if (result !== null) {
      if (result.winner === game.getCurrentPlayer()) return 1000 + depth;
      if (result.winner !== null) return -1000 - depth;
      return 0; // Draw
    }
    
    if (depth === 0) {
      return this.evaluatePositionPerfect(game);
    }
    
    const validMoves = game.getValidMoves();
    let bestScore = -Infinity;
    let flag = 'UPPERBOUND';
    
    for (const move of validMoves) {
      const tempGame = game.clone();
      tempGame.makeMove(move);
      
      const score = -this.negamax(tempGame, depth - 1, -beta, -alpha);
      bestScore = Math.max(bestScore, score);
      
      if (score >= beta) {
        flag = 'LOWERBOUND';
        break;
      }
      if (score > alpha) {
        alpha = score;
        flag = 'EXACT';
      }
    }
    
    // Store in transposition table
    this.transpositionTable.set(gameState, {
      score: bestScore,
      depth,
      flag,
    });
    
    return bestScore;
  }
  
  private evaluatePositionPerfect(game: TimedStandardGame): number {
    // Perfect evaluation using threat analysis and positional factors
    const board = game.getBoard();
    const currentPlayer = game.getCurrentPlayer();
    
    let evaluation = 0;
    
    // Analyze all threat patterns
    evaluation += this.analyzeThreats(board, currentPlayer) * 100;
    evaluation -= this.analyzeThreats(board, 1 - currentPlayer) * 100;
    
    // Positional factors
    evaluation += this.analyzeCenterControl(board, currentPlayer) * 3;
    evaluation += this.analyzeConnections(board, currentPlayer) * 2;
    
    return evaluation;
  }
  
  private initializeOpeningBook(): void {
    // Pre-computed optimal opening moves
    this.openingBook.set('empty_board', 3); // Center is optimal first move
    
    // Add more opening positions based on game theory analysis
    // This would typically be loaded from a database or file
  }
}
```

### Bot Features
- **Difficulty Progression**: 8 levels from random to perfect play
- **Unique Strategies**: Each bot has distinct playing style
- **Performance Optimization**: Efficient move calculation algorithms
- **Realistic Timing**: Simulated thinking time for better UX
- **Extensibility**: Easy to add new bot implementations

## Development Utilities

### Game State Analysis
- **Position Evaluation**: Static board position analysis
- **Threat Detection**: Identify immediate threats and opportunities
- **Pattern Recognition**: Recognize common tactical patterns
- **Move Generation**: Generate all legal moves efficiently

### Performance Profiling
- **Algorithm Timing**: Measure bot decision-making speed
- **Memory Usage**: Track memory consumption during analysis
- **Cache Efficiency**: Monitor transposition table hit rates
- **Scaling Analysis**: Performance at different search depths

### Testing Tools
- **Position Testing**: Test bots against specific positions
- **Tournament Simulation**: Run bot vs bot tournaments
- **Regression Testing**: Ensure bot behavior consistency
- **Benchmark Suites**: Standard position test suites

---

*This documentation covers the tools and utilities that support the ConnectFour application. For core game logic, see the Services documentation.*