import { useRef, useState, useCallback, MutableRefObject } from "react"

// Common interface for games that support move navigation
export interface NavigableGame {
  getMoves(): number[]
  getCurrentMoveIndex(): number
  getBoard(): (number | null)[][]
  gameOver: boolean
  winner: number | null
  setMoveIndex(index: number): boolean
  adjMoveIndex(delta: number): boolean
  exportMoves(): string
}

// Abstract animation functions - to be implemented by the consumer
export interface GameHistoryAnimations {
  /** Trigger animation when moving between move indices */
  onAnimate?: (fromIndex: number, toIndex: number) => void
  /** Trigger undo animation when going backwards */
  onUndoAnimation?: () => void
  /** Force UI update/re-render */
  onBump?: () => void
}

/**
 * Reusable UI helper hook for game history navigation
 * Provides all necessary handlers for MoveHistory and GameControls components
 * Uses abstract animation callbacks for maximum flexibility
 */
export function useGameHistory(
  gameRef: MutableRefObject<NavigableGame | null>,
  animations: GameHistoryAnimations = {}
) {
  const [, forceUpdate] = useState(0)

  // Force UI update with optional bump callback
  const bump = useCallback(() => {
    animations.onBump?.()
    forceUpdate(prev => prev + 1)
  }, [animations])

  // Core navigation with animation support
  const navigateToMove = useCallback((targetIndex: number): boolean => {
    if (!gameRef.current) return false

    const currentIndex = gameRef.current.getCurrentMoveIndex()
    const success = gameRef.current.setMoveIndex(targetIndex)

    if (success && currentIndex !== targetIndex) {
      // Trigger appropriate animation based on direction
      if (targetIndex < currentIndex) {
        animations.onUndoAnimation?.()
      }
      
      animations.onAnimate?.(currentIndex, targetIndex)
      bump()
    }

    return success
  }, [gameRef, animations, bump])

  // Navigation handlers for MoveHistory component
  const handleMoveClick = useCallback((moveIndex: number): void => {
    navigateToMove(moveIndex)
  }, [navigateToMove])

  // Navigation handlers for GameControls component
  const handleFirstMove = useCallback((): void => {
    if (navigateToMove(-1)) {
      animations.onUndoAnimation?.()
    }
  }, [navigateToMove, animations])

  const handlePreviousMove = useCallback((): void => {
    if (!gameRef.current) return
    
    const currentIndex = gameRef.current.getCurrentMoveIndex()
    if (currentIndex > -1) {
      navigateToMove(currentIndex - 1)
    }
  }, [gameRef, navigateToMove])

  const handleNextMove = useCallback((): void => {
    if (!gameRef.current) return
    
    const currentIndex = gameRef.current.getCurrentMoveIndex()
    const totalMoves = gameRef.current.getMoves().length
    if (currentIndex < totalMoves - 1) {
      navigateToMove(currentIndex + 1)
    }
  }, [gameRef, navigateToMove])

  const handleLastMove = useCallback((): void => {
    if (!gameRef.current) return
    
    const totalMoves = gameRef.current.getMoves().length
    if (totalMoves > 0) {
      navigateToMove(totalMoves - 1)
    }
  }, [gameRef, navigateToMove])

  // Quick navigation utilities
  const goToStart = useCallback(() => handleFirstMove(), [handleFirstMove])
  const goToEnd = useCallback(() => handleLastMove(), [handleLastMove])
  const goBack = useCallback(() => handlePreviousMove(), [handlePreviousMove])
  const goForward = useCallback(() => handleNextMove(), [handleNextMove])

  // State checkers (memoized for performance)
  const canGoBack = useCallback((): boolean => {
    const currentIndex = gameRef.current?.getCurrentMoveIndex() ?? -1
    return currentIndex > -1
  }, [gameRef])

  const canGoForward = useCallback((): boolean => {
    if (!gameRef.current) return false
    const currentIndex = gameRef.current.getCurrentMoveIndex()
    const totalMoves = gameRef.current.getMoves().length
    return currentIndex < totalMoves - 1
  }, [gameRef])

  const isUpToDate = useCallback((): boolean => {
    if (!gameRef.current) return true
    const currentIndex = gameRef.current.getCurrentMoveIndex()
    const totalMoves = gameRef.current.getMoves().length
    return currentIndex === totalMoves - 1
  }, [gameRef])

  return {
    // Component handlers (ready to pass directly to components)
    handleMoveClick,
    handleFirstMove,
    handlePreviousMove,
    handleNextMove,
    handleLastMove,
    
    // Quick navigation
    goToStart,
    goToEnd,
    goBack,
    goForward,
    navigateToMove,
    
    // State checkers
    canGoBack,
    canGoForward,
    isUpToDate,
    
    // UI utilities
    bump
  }
}
