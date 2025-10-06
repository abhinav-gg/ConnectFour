"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import ToolUI from "@/components/game/full-sides/ToolUI"
import { HistoryStandardGame } from "@shared/utils/Games/history-game"
import { useGameHistory } from "@/components/game/gameHistoryService"
import { useWASM } from "@/components/providers/WASMProvider"
import { logger } from '@/utils/logger'

export default function ToolsPage() {
  // Simple state management like SingleplayerBoardHandler
  const gameRef = useRef<HistoryStandardGame>(new HistoryStandardGame())
  const unifiedLayoutRef = useRef<any>(null)
  
  // Separate ref for analysis/move history updates - doesn't trigger full re-renders
  const analysisGameStateRef = useRef<{
    boardState: (number | null)[][]
    moves: number[]
    currentMoveIndex: number
    gameOver: boolean
  }>({
    boardState: gameRef.current.getBoard(),
    moves: gameRef.current.exportMoves().split('').map(m => parseInt(m) - 1), // Convert back to 0-based for analysis
    currentMoveIndex: gameRef.current.getCurrentMoveIndex(),
    gameOver: gameRef.current.gameOver
  })
  
  // WASM state and activation
  const { isReady: wasmReady, activateWASM, isActive } = useWASM()
  
  // Track if we've done initial analysis
  const hasInitializedRef = useRef(false)
  
  // Activate WASM immediately when component mounts
  useEffect(() => {
    logger.debug("TOOLS: Activating WASM...")
    activateWASM()
  }, [activateWASM])

  // Log WASM state changes
  useEffect(() => {
    logger.debug("TOOLS: WASM state - isActive:", isActive, "isReady:", wasmReady)
  }, [isActive, wasmReady])
  
  // Simple state - only what's needed for board rendering (stable)
  const [gameOver, setGameOver] = useState(false)
  const [gameStateVersion, setGameStateVersion] = useState(1) // Start at 1 to trigger initial analysis
  const [boardKey, setBoardKey] = useState(0) // Force board re-renders when needed

  // Create reusable animation setup
  // Simple animation setup
  const updateAnalysisGameState = useCallback(() => {
    analysisGameStateRef.current = {
      boardState: gameRef.current.getBoard(),
      moves: gameRef.current.exportMoves().split('').map(m => parseInt(m) - 1),
      currentMoveIndex: gameRef.current.getCurrentMoveIndex(),
      gameOver: gameRef.current.gameOver
    }
    setGameStateVersion(prev => prev + 1)
  }, [])

  // Initialize analysis only when WASM is ready - one time only
  useEffect(() => {
    if (wasmReady && !hasInitializedRef.current) {
      logger.debug("TOOLS: WASM ready, triggering initial analysis");
      hasInitializedRef.current = true
      // Trigger analysis by updating the game state version
      updateAnalysisGameState()
      // Also force a version bump to ensure ToolUI picks it up
      setGameStateVersion(prev => prev + 1)
    }
  }, [wasmReady, updateAnalysisGameState])

  // Also trigger analysis immediately regardless of WASM state for ToolUI
  useEffect(() => {
    logger.debug("TOOLS: Triggering analysis state update - version:", gameStateVersion);
  }, [gameStateVersion])

  const gameHistoryAnimations = {
    layoutRef: unifiedLayoutRef,
    onBump: updateAnalysisGameState
  }
  
  // Game history service
  const gameHistory = useGameHistory(gameRef, gameHistoryAnimations)

  // Simple column handler like SingleplayerBoardHandler
  const handleColumnAttempt = useCallback((col: number) => {
    if (gameRef.current.gameOver) {
      return
    }
    
    const result = gameRef.current.makeMove(col)
    if (result.success) {
      const player = gameRef.current.currentPlayer === 0 ? 1 : 0 // Previous player
      
      // Trigger animation immediately
      unifiedLayoutRef.current?.triggerMoveAnimation(result.row, col, player)
      
      // Update state after animation has time to start
      setTimeout(() => {
        setGameOver(gameRef.current.gameOver)
        updateAnalysisGameState() // Update analysis state and trigger ToolUI updates
      }, 30) // Short delay to let animation start
    }
  }, [])

  // Simple reset
  const handleResetGame = useCallback(() => {
    gameRef.current = new HistoryStandardGame()
    setGameOver(false)
    setBoardKey(prev => prev + 1) // Force board re-render
    updateAnalysisGameState()
    unifiedLayoutRef.current?.clearPremove()
  }, [updateAnalysisGameState])

  // Simple move submission - reset game first, then apply moves
  const handleSubmitMoves = useCallback((moves: number[]) => {
    
    // First reset the game to empty position
    gameRef.current = new HistoryStandardGame()
    setGameOver(false)
    setBoardKey(prev => prev + 1) // Force board re-render
    updateAnalysisGameState()
    unifiedLayoutRef.current?.clearPremove()
    
    // If no moves provided, just show empty board
    if (!moves || moves.length === 0) {
      return
    }
    
    // Convert moves to 0-based indexing
    const columnMoves = moves.map(move => move - 1)
    
    // Set all moves except the last one instantly (no animation)
    const movesToSet = columnMoves.slice(0, -1)
    const lastMove = columnMoves[columnMoves.length - 1]
    
    // Apply all but last move instantly
    movesToSet.forEach(move => {
      if (!gameRef.current.gameOver) {
        gameRef.current.makeMove(move)
      }
    })
    
    // Force board state update after setting all but last move
    setGameOver(gameRef.current.gameOver)
    setGameStateVersion(prev => prev + 1) // Notify ToolUI of changes
    setBoardKey(prev => prev + 1) // Force board re-render for new position
    updateAnalysisGameState()
    
    // Then animate the final move after a short delay
    setTimeout(() => {
      if (!gameRef.current.gameOver) {
        handleColumnAttempt(lastMove)
      }
    }, 100)
  }, [handleColumnAttempt, updateAnalysisGameState])

  return (
    <UnifiedGameLayout
      ref={unifiedLayoutRef}
      board={{
        interactive: true,
        onColumnAttempt: handleColumnAttempt,
        boardState: gameRef.current.getBoard(), // Direct like SingleplayerBoardHandler
        gameOver: gameOver,
        animate_init: false,
        key: `tools-board-${boardKey}`, // Dynamic key to force re-renders when board state changes
      }}
      layout={{
        contentRatio: "50%",
        showScoreBar: false,
        showTimers: false,
        showPlayerInfo: false,
      }}
    >
      <div className="flex-1 min-h-0">
        <ToolUI
          game={gameRef.current}
          gameStateVersion={gameStateVersion}
          layoutRef={unifiedLayoutRef}
          onBump={updateAnalysisGameState}
          showAnalysisFeatures={true}
          showEnterMoves={true}
          enterMovesPlaceholder="Enter moves (1-7)"
          onSubmitMoves={handleSubmitMoves}
          onToggleAnalysis={() => {}}
          onSettingsClick={handleResetGame}
          onColumnClick={handleColumnAttempt}
        />
      </div>
    </UnifiedGameLayout>
  )
}