import { useRef, useState, useCallback, MutableRefObject } from "react"
import { NavigableGame } from '@shared/types/game.types'

// Simple animation interface - just need the layout ref and update function
export interface GameHistoryAnimations {
  layoutRef: MutableRefObject<any>
  onBump: () => void
}

/**
 * Reusable UI helper hook for game history navigation
 * Provides all necessary handlers for MoveHistory and GameControls components
 * Handles animations directly without separate animation files
 */
export function useGameHistory<T extends NavigableGame>(
  gameRef: MutableRefObject<T>,
  animations: GameHistoryAnimations
) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const bump = animations.onBump

  // Calculate board state at a specific move index
  const calculateBoardAtIndex = useCallback((index: number): (number | null)[][] => {
    const board = Array.from({ length: 6 }, () => Array(7).fill(null))
    const moves = gameRef.current.getAllMoves() // Use getAllMoves to get the full move history
    
    for (let i = 0; i <= index; i++) {
      if (i < moves.length) {
        const col = moves[i]
        let targetRow = 5
        while (targetRow >= 0 && board[targetRow][col] !== null) {
          targetRow--
        }
        if (targetRow >= 0) {
          board[targetRow][col] = i % 2 === 0 ? 0 : 1
        }
      }
    }
    return board
  }, [gameRef])

  // Core navigation with animation support
  const navigateToMove = useCallback((targetIndex: number): boolean => {
    if (!gameRef.current) return false

    const currentIndex = gameRef.current.getCurrentMoveIndex()
    if (currentIndex === targetIndex) return true

    // Set the final position in the game (this affects analysis)
    const success = gameRef.current.setMoveIndex(targetIndex)
    if (!success) return false

    // Update analysis immediately for final position
    bump()

    if (targetIndex < currentIndex) {
      // Going backwards: set board to interim position (target+1), then animate undo to target
      const interimIndex = targetIndex + 1
      const interimBoard = calculateBoardAtIndex(interimIndex)
      
      // Set board to interim position visually (where the piece is before removal)
      animations.layoutRef.current?.setBoard(interimBoard)
      
      // Wait then animate removal of the move we're undoing
      setTimeout(() => {
        const moveCol = gameRef.current.getAllMoves()[interimIndex]
        if (moveCol !== undefined) {
          // Find the topmost piece to remove (the move we're undoing)
          let targetRow = -1
          for (let row = 0; row < 6; row++) {
            if (interimBoard[row][moveCol] !== null) {
              targetRow = row
              break
            }
          }
          if (targetRow >= 0) {
            const player = interimIndex % 2 === 0 ? 0 : 1
            
            // Calculate last move highlight for target position
            let finalLastMoveHighlight = null
            if (targetIndex >= 0) {
              const lastMoveCol = gameRef.current.getAllMoves()[targetIndex]
              if (lastMoveCol !== undefined) {
                const finalBoard = calculateBoardAtIndex(targetIndex)
                for (let row = 0; row < 6; row++) {
                  if (finalBoard[row][lastMoveCol] !== null) {
                    finalLastMoveHighlight = { row, col: lastMoveCol }
                    break
                  }
                }
              }
            }
            
            animations.layoutRef.current?.undoMoveAnimation(targetRow, moveCol, player, finalLastMoveHighlight)
          }
        }
      }, 100)
      return true
    } else {
      // Going forwards: set board to target-1, then animate to target
      const interimIndex = targetIndex - 1
      const interimBoard = calculateBoardAtIndex(interimIndex)
      
      // Set board to interim position visually
      animations.layoutRef.current?.setBoard(interimBoard)
      
      // Wait then animate addition
      setTimeout(() => {
        const moveCol = gameRef.current.getAllMoves()[targetIndex]
        if (moveCol !== undefined) {
          // Find target row for the new piece
          let targetRow = 5
          while (targetRow >= 0 && interimBoard[targetRow][moveCol] !== null) {
            targetRow--
          }
          if (targetRow >= 0) {
            const player = targetIndex % 2 === 0 ? 0 : 1
            animations.layoutRef.current?.triggerMoveAnimation(targetRow, moveCol, player)
          }
        }
      }, 100)
      return true
    }

    return success
  }, [gameRef, animations, bump, calculateBoardAtIndex])


  // Navigation handlers for MoveHistory component
  const handleMoveClick = useCallback((moveIndex: number): void => {
    console.log(`🎮 HISTORY: handleMoveClick called with moveIndex=${moveIndex}`)
    navigateToMove(moveIndex)
  }, [navigateToMove])

  // Navigation handlers for GameControls component
  const handleFirstMove = useCallback((): void => {
    navigateToMove(0)
  }, [navigateToMove])

  const handlePreviousMove = useCallback((): void => {
    if (!gameRef.current) return
    
    const currentIndex = gameRef.current.getCurrentMoveIndex()
    if (currentIndex > 0) {
      navigateToMove(currentIndex - 1)
    }
  }, [gameRef, navigateToMove])

  const handleNextMove = useCallback((): void => {
    if (!gameRef.current) return
    
    const currentIndex = gameRef.current.getCurrentMoveIndex()
    const totalMoves = gameRef.current.getMoves().length
    if (currentIndex < totalMoves) {
      navigateToMove(currentIndex + 1)
    }
  }, [gameRef, navigateToMove])

  const handleLastMove = useCallback((): void => {
    if (!gameRef.current) return
    
    const totalMoves = gameRef.current.getMoves().length
    navigateToMove(totalMoves)
  }, [gameRef, navigateToMove])

  // Quick navigation utilities
  const goToStart = useCallback(() => handleFirstMove(), [handleFirstMove])
  const goToEnd = useCallback(() => handleLastMove(), [handleLastMove])
  const goBack = useCallback(() => handlePreviousMove(), [handlePreviousMove])
  const goForward = useCallback(() => handleNextMove(), [handleNextMove])

  // State checkers (memoized for performance)
  const canGoBack = useCallback((): boolean => {
    const currentIndex = gameRef.current?.getCurrentMoveIndex() ?? 0
    return currentIndex > 0
  }, [gameRef])

  const canGoForward = useCallback((): boolean => {
    if (!gameRef.current) return false
    const currentIndex = gameRef.current.getCurrentMoveIndex()
    const totalMoves = gameRef.current.getMoves().length
    return currentIndex < totalMoves
  }, [gameRef])

  const isUpToDate = useCallback((): boolean => {
    if (!gameRef.current) return true
    const currentIndex = gameRef.current.getCurrentMoveIndex()
    const totalMoves = gameRef.current.getMoves().length
    return currentIndex === totalMoves
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
