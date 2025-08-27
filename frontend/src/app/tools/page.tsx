"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import ToolUI from "@/components/game/ToolUI"
import { StandardGame } from "@shared/utils/Games/game"
import { WASMProvider, useWASM } from "@/components/providers/wasmProvider"

function ToolsPageContent() {
  // Simple state management like SingleplayerBoardHandler
  const gameRef = useRef<StandardGame>(new StandardGame())
  const unifiedLayoutRef = useRef<any>(null)
  
  // Separate ref for analysis/move history updates - doesn't trigger full re-renders
  const analysisGameStateRef = useRef<{
    boardState: (number | null)[][]
    moves: number[]
    currentMoveIndex: number
    gameOver: boolean
  }>({
    boardState: gameRef.current.getBoard(),
    moves: gameRef.current.getMoves(),
    currentMoveIndex: gameRef.current.currentMoveIndex,
    gameOver: gameRef.current.gameOver
  })
  
  // WASM state
  const { isReady: wasmReady } = useWASM()
  
  // Simple state - only what's needed for board rendering (stable)
  const [gameOver, setGameOver] = useState(false)
  const [gameStateVersion, setGameStateVersion] = useState(0) // For ToolUI notifications only
  const [boardKey, setBoardKey] = useState(0) // Force board re-renders when needed

  console.log("🔧 TOOLS: Rendering with", gameRef.current.getMoves().length, "moves, WASM ready:", wasmReady)

  // Helper function to update analysis state without causing full re-renders
  const updateAnalysisGameState = useCallback(() => {
    analysisGameStateRef.current = {
      boardState: gameRef.current.getBoard(),
      moves: gameRef.current.getMoves(),
      currentMoveIndex: gameRef.current.currentMoveIndex,
      gameOver: gameRef.current.gameOver
    }
    // Only increment version to trigger ToolUI analysis updates
    setGameStateVersion(prev => prev + 1)
  }, [])

  // Simple column handler like SingleplayerBoardHandler
  const handleColumnAttempt = useCallback((col: number) => {
    if (gameRef.current.gameOver) {
      console.log("🔧 TOOLS: Game over, ignoring move")
      return
    }

    console.log(`🔧 TOOLS: Making move in column ${col + 1}`)
    
    const result = gameRef.current.makeMove(col)
    if (result.success) {
      const player = gameRef.current.currentPlayer === 0 ? 1 : 0 // Previous player
      console.log(`🔧 TOOLS: Move successful - triggering animation:`, { row: result.row, col, player })
      
      // Trigger animation immediately
      unifiedLayoutRef.current?.triggerMoveAnimation(result.row, col, player)
      
      // Update state to trigger re-renders and analysis updates
      setGameOver(gameRef.current.gameOver)
      updateAnalysisGameState() // Update analysis state and trigger ToolUI updates
      
      console.log(`🔧 TOOLS: Move complete`)
    }
  }, [])

  // Simple move navigation
  const handleMoveClick = useCallback((moveIndex: number) => {
    console.log("🔧 TOOLS: Navigating to move", moveIndex)
    if (gameRef.current.setMoveIndex(moveIndex - 1)) {
      updateAnalysisGameState()
    }
  }, [updateAnalysisGameState])

  // Simple reset
  const handleResetGame = useCallback(() => {
    console.log("🔧 TOOLS: Resetting game")
    gameRef.current = new StandardGame()
    setGameOver(false)
    setBoardKey(prev => prev + 1) // Force board re-render
    updateAnalysisGameState()
    unifiedLayoutRef.current?.clearPremove()
  }, [updateAnalysisGameState])

  // Simple move submission - reset game first, then apply moves
  const handleSubmitMoves = useCallback((moves: number[]) => {
    console.log("🔧 TOOLS: Submitting moves:", moves)
    
    // First reset the game to empty position
    console.log("🔧 TOOLS: Resetting game for new position")
    gameRef.current = new StandardGame()
    setGameOver(false)
    setBoardKey(prev => prev + 1) // Force board re-render for reset
    updateAnalysisGameState()
    unifiedLayoutRef.current?.clearPremove()
    
    // If no moves provided, just show empty board
    if (!moves || moves.length === 0) {
      console.log("🔧 TOOLS: No moves provided, showing empty board")
      return
    }
    
    // Convert moves to 0-based indexing
    const columnMoves = moves.map(move => move - 1)
    
    // Set all moves except the last one instantly (no animation)
    const movesToSet = columnMoves.slice(0, -1)
    const lastMove = columnMoves[columnMoves.length - 1]
    
    console.log("🔧 TOOLS: Setting", movesToSet.length, "moves instantly, then animating last move")
    
    // Apply all but last move instantly
    movesToSet.forEach(move => {
      if (!gameRef.current.gameOver) {
        gameRef.current.makeMove(move)
      }
    })
    
    // Force board state update after setting all but last move
    setGameOver(gameRef.current.gameOver)
    setGameStateVersion(prev => prev + 1) // Notify ToolUI of changes
    setBoardKey(prev => prev + 1) // Force board re-render
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
          currentMoveIndex={analysisGameStateRef.current.currentMoveIndex}
          showAnalysisFeatures={true}
          showOpeningDescription={false}
          openingName="Position Analysis"
          showEnterMoves={true}
          enterMovesDisabled={gameOver}
          enterMovesPlaceholder="Enter moves (1-7)"
          onSubmitMoves={handleSubmitMoves}
          onMoveClick={handleMoveClick}
          onToggleAnalysis={() => {}}
          onSettingsClick={handleResetGame}
          onCloseOpening={() => {}}
          onColumnClick={handleColumnAttempt}
        />
      </div>
    </UnifiedGameLayout>
  )
}

export default function ToolsPage() {
  return (
    <WASMProvider>
      <ToolsPageContent />
    </WASMProvider>
  )
}