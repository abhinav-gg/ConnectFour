# Unified Game Layout - Architecture & Migration Guide

## Overview

The `UnifiedGameLayout` combines the best features of both `GameBoardLayout` and `BoardSpaceLayout` into a single, highly reusable component that maximizes flexibility while maintaining clean architecture.

## Best Practices Implemented

### 1. **Single Responsibility with Mode Switching**
- **Simple Mode**: Clean board + content layout (replaces BoardSpaceLayout)
- **Full Game Mode**: Complete game interface with players, timers, scores (replaces GameBoardLayout)
- Mode switching eliminates the need for multiple layout components

### 2. **Flexible Data Binding**
```tsx
// Support both direct values AND refs for maximum flexibility
gameState={{
  // Direct values (simple)
  scoreRatio: 0.5,
  isGameRunning: true,
  
  // OR ref-based (advanced)
  scoreRatioRef: myScoreRef,
  isGameRunningRef: myGameRunningRef,
}}
```

### 3. **Composable Configuration**
- **Board config**: All board-related props in one object
- **Game state**: All game data (supports refs or direct values)
- **Layout config**: Visual and behavioral settings
- **Clean separation** of concerns

### 4. **Hydration Safety**
- Consistent SSR/CSR rendering
- No hydration mismatches
- Graceful loading states

### 5. **Type Safety**
- Comprehensive TypeScript interfaces
- Proper ref forwarding
- Helper functions with type guards

### 6. **Performance Optimizations**
- Minimal re-renders through proper memoization
- Efficient ref-based updates
- Responsive design without layout thrashing

## Component Architecture

### Core Interface Design
```tsx
interface UnifiedGameLayoutProps {
  children: React.ReactNode
  
  board?: {
    showBoard?: boolean          // Toggle board visibility
    interactive?: boolean        // Board interactivity
    onColumnAttempt?: Function   // Move handler
    boardState?: Cell[][]        // Board data
    // ... other board props
  }
  
  gameState?: {
    // Flexible data binding - use either direct OR ref values
    scoreRatio?: number | React.MutableRefObject<number>
    player1?: PlayerData | React.MutableRefObject<PlayerData>
    // ... other game state
  }
  
  layout?: {
    mode?: "simple" | "full-game"    // Layout mode
    showScoreBar?: boolean           // Component visibility
    showTimers?: boolean
    showPlayerInfo?: boolean
    headerText?: string              // NEW: Header between players
    contentRatio?: "50%" | "66%"     // Board vs content ratio
  }
}
```

### Helper Functions
```tsx
// Smart value extraction from refs or direct values
function useValueOrRef<T>(valueOrRef: T | MutableRefObject<T>, fallback: T): T

// Player data extraction with fallbacks
function usePlayerData(playerOrRef: PlayerData | MutableRefObject<PlayerData>, fallbackName: string): PlayerData
```

## Migration Guide

### From BoardSpaceLayout
```tsx
// OLD: BoardSpaceLayout
<BoardSpaceLayout
  boardProps={{ interactive: true, onColumnAttempt: handleMove }}
  showBoard={true}
  boardColumnRatio="66%"
>
  <MyContent />
</BoardSpaceLayout>

// NEW: UnifiedGameLayout (Simple Mode)
<UnifiedGameLayout
  board={{
    showBoard: true,
    interactive: true,
    onColumnAttempt: handleMove
  }}
  layout={{
    mode: "simple",
    contentRatio: "66%"
  }}
>
  <MyContent />
</UnifiedGameLayout>
```

### From GameBoardLayout
```tsx
// OLD: GameBoardLayout (complex with many props)
<GameBoardLayout
  boardProps={{ interactive: true, onColumnAttempt: handleMove }}
  scoreRatio={scoreRatio}
  isGameRunningRef={isGameRunningRef}
  meRef={meRef}
  opponentRef={opponentRef}
  displayScoreBar={true}
  // ... many more props
>
  <MyGameUI />
</GameBoardLayout>

// NEW: UnifiedGameLayout (Full Game Mode)
<UnifiedGameLayout
  board={{
    interactive: true,
    onColumnAttempt: handleMove
  }}
  gameState={{
    scoreRatioRef: scoreRatioRef,     // Or direct: scoreRatio: 0.5
    isGameRunningRef: isGameRunningRef,
    player1: player1Ref,              // Or direct: player1: playerData
    player2: player2Ref
  }}
  layout={{
    mode: "full-game",
    showScoreBar: true,
    showTimers: true,
    showPlayerInfo: true,
    headerText: "Championship Match"   // NEW feature
  }}
>
  <MyGameUI />
</UnifiedGameLayout>
```

## Key Improvements Over Previous Layouts

### 1. **Eliminated Complexity**
- **Before**: Separate components with overlapping functionality
- **After**: Single component with mode switching

### 2. **Added Flexibility**
- **Header text support**: Clean space between top player and timer
- **Dual data binding**: Support both refs and direct values
- **Configurable visibility**: Toggle any UI component

### 3. **Better Responsiveness**
- **Mobile optimization**: Header text properly positioned on mobile
- **Consistent spacing**: Better alignment and spacing control
- **Adaptive layouts**: Seamless desktop/mobile transitions

### 4. **Future-Proofing**
- **Extensible config**: Easy to add new features without breaking changes
- **Type safety**: Comprehensive TypeScript support
- **Clean interfaces**: Clear separation of concerns

## Usage Examples

### Tools/Analysis Page (Simple Mode)
```tsx
<UnifiedGameLayout
  board={{
    showBoard: true,
    interactive: true,
    onColumnAttempt: handleMove,
    boardState: game.getBoard()
  }}
  layout={{
    mode: "simple",
    contentRatio: "66%"
  }}
>
  <AnalysisTools />
</UnifiedGameLayout>
```

### Live Game (Full Mode)
```tsx
<UnifiedGameLayout
  board={{
    interactive: true,
    onColumnAttempt: handleMove,
    boardState: gameRef.current.getBoard()
  }}
  gameState={{
    scoreRatioRef: scoreRef,
    isGameRunningRef: gameRunningRef,
    player1: player1Ref,
    player2: player2Ref,
    currentTurn: currentTurnRef
  }}
  layout={{
    mode: "full-game",
    showScoreBar: true,
    showTimers: true,
    showPlayerInfo: true,
    headerText: "Ranked Match - Round 1"
  }}
>
  <LiveGameUI />
</UnifiedGameLayout>
```

### Spectator Mode
```tsx
<UnifiedGameLayout
  board={{
    interactive: false,
    boardState: spectatedGame.getBoard()
  }}
  gameState={{
    player1: spectatedPlayers.player1,
    player2: spectatedPlayers.player2,
    isGameRunning: true
  }}
  layout={{
    mode: "full-game",
    showPlayerInfo: true,
    showTimers: true,
    headerText: "Live Match - Spectating"
  }}
>
  <SpectatorUI />
</UnifiedGameLayout>
```

## Next Steps

1. **Test the unified layout** using `/test-layout` page
2. **Gradually migrate** existing components
3. **Update imports** from old layouts to new unified layout
4. **Remove deprecated** layout components once migration is complete
5. **Enhance features** using the new flexible architecture

The unified layout provides a solid foundation for all game-related interfaces while maintaining clean separation of concerns and maximum reusability.
