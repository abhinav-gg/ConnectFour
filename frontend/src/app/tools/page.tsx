"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import ToolUI from "@/components/game/ToolUI"
import { StandardGame } from "@shared/utils/Games/game"
import { SelfAnalysis } from "@shared/utils/analysis"

export default function ToolsPage() {
  // Game state refs
  const gameRef = useRef<StandardGame>(new StandardGame())
  const analysisRef = useRef<SelfAnalysis | null>(null)
  const unifiedLayoutRef = useRef<any>(null) // Reference to the unified layout for board control
  
  // State for UI updates
  const [gameVersion, setGameVersion] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [analysis, setAnalysis] = useState<string>("Position evaluation loading...")
  const [currentEvaluation, setCurrentEvaluation] = useState<number>(0) // Store raw evaluation
  const [showOpeningDescription, setShowOpeningDescription] = useState(false)
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(true)
  
  // Analysis data ref for live updates
  const analysisDataRef = useRef<string[]>(["Position evaluation loading..."])
  const columnEvaluationsRef = useRef<number[]>(Array(7).fill(-1000)) // Raw evaluation numbers for columns
  
  // Initialize analysis on component mount
  useEffect(() => {
    const initializeAnalysis = async () => {
      try {
        console.log("🔧 TOOLS: Initializing analysis...")
        setIsAnalysisLoading(true)
        analysisRef.current = await SelfAnalysis.load(gameRef.current)
        updateAnalysis()
        setIsAnalysisLoading(false)
      } catch (error) {
        console.error("Failed to load analysis:", error)
        setAnalysis("Analysis unavailable - WASM solver failed to load")
        setIsAnalysisLoading(false)
      }
    }
    
    initializeAnalysis()
  }, [])
  
  // Function to update analysis display
  const updateAnalysis = useCallback(() => {
    if (analysisRef.current && !isAnalysisLoading) {
      try {
        const evaluation = analysisRef.current.Eval()
        const moveCount = gameRef.current.getMoves().length
        const currentPlayer = gameRef.current.currentPlayer === 0 ? "Red" : "Yellow"
        const moves = gameRef.current.getMoves()
        const positionString = gameRef.current.exportMoves()
        
        console.log("=== ANALYSIS DEBUG ===")
        console.log("Position moves:", moves)
        console.log("Position string:", positionString)
        console.log("Move count:", moveCount)
        console.log("Current player:", currentPlayer)
        console.log("Raw evaluation:", evaluation)
        console.log("Evaluation > 0?", evaluation > 0)
        console.log("Evaluation < 0?", evaluation < 0)
        console.log("Math.abs(evaluation):", Math.abs(evaluation))
        
        // Generate simple analysis text for header - just M(number) or DRAW
        let headerEval = ""
        if (Math.abs(evaluation) >= 50) {
          headerEval = "DRAW"
        } else {
          headerEval = `M${Math.abs(evaluation)}`
        }
        
        console.log("Header evaluation text:", headerEval)
        console.log("Badge color for evaluation", evaluation, "should be:", 
                   evaluation > 0 ? "yellow" : evaluation < 0 ? "red" : "gray")
        console.log("Current player to move:", currentPlayer)
        console.log("Current player index:", gameRef.current.currentPlayer)
        
        // Get column analysis using the Analyze() method
        const columnAnalysisResults = analysisRef.current.Analyze()
        console.log("Column analysis results:", columnAnalysisResults)
        
        const columnAnalyses: string[] = []
        const columnEvals: number[] = []
        
        for (let col = 0; col < 7; col++) {
          try {
            const tempGame = new StandardGame(gameRef.current.getMoves())
            if (tempGame.getAvailableRow(col) !== -1 && !tempGame.gameOver) {
              // Use the analysis result for this column
              const colEval = columnAnalysisResults[col]
              console.log(`Column ${col + 1} evaluation:`, colEval)
              
              columnEvals.push(colEval)
              
              if (Math.abs(colEval) >= 50) {
                columnAnalyses.push("DRAW")
              } else {
                columnAnalyses.push(`M${Math.abs(colEval)}`)
              }
            } else {
              console.log(`Column ${col + 1}: FULL`)
              columnEvals.push(-1000) // Full column
              columnAnalyses.push("FULL")
            }
          } catch (error) {
            console.error(`Column ${col + 1} analysis error:`, error)
            columnEvals.push(-1000) // Error state
            columnAnalyses.push("---")
          }
        }
        
        console.log("Column evaluations:", columnEvals)
        console.log("Column analyses:", columnAnalyses)
        console.log("=====================")
        
        setAnalysis(headerEval)
        setCurrentEvaluation(evaluation)
        analysisDataRef.current = [headerEval, ...columnAnalyses]
        columnEvaluationsRef.current = columnEvals
      } catch (error) {
        console.error("Error updating analysis:", error)
        setAnalysis("ERROR")
        analysisDataRef.current = ["ERROR", "---", "---", "---", "---", "---", "---", "---"]
        columnEvaluationsRef.current = Array(7).fill(-1000)
      }
    }
  }, [isAnalysisLoading])
  
  // Handle column attempts (local multiplayer)
  const handleColumnAttempt = useCallback((col: number) => {
    if (gameRef.current.gameOver) {
      console.log("🔧 TOOLS: Game is over, ignoring move")
      return
    }
    
    console.log(`🔧 TOOLS: Attempting move in column ${col + 1} by player ${gameRef.current.currentPlayer}`)
    
    const result = gameRef.current.makeMove(col)
    if (result.success) {
      const player = gameRef.current.currentPlayer === 0 ? 1 : 0 // Previous player who made the move
      console.log(`🔧 TOOLS: Move successful - row: ${result.row}, col: ${col}, player: ${player}`)
      
      // Trigger board animation
      unifiedLayoutRef.current?.triggerMoveAnimation(result.row, col, player)
      
      // Update game state
      setGameOver(gameRef.current.gameOver)
      setGameVersion(prev => prev + 1)
      
      // Update analysis
      updateAnalysis()
      
      if (gameRef.current.gameOver) {
        console.log("🔧 TOOLS: Game ended")
      }
    }
  }, [updateAnalysis])
  
  // Handle moves submitted through the EnterMoves component
  const handleSubmitMoves = useCallback((moves: number[]) => {
    console.log("🔧 TOOLS: Submitting moves:", moves)
    
    // Convert 1-7 input to 0-6 columns
    const columnMoves = moves.map(move => move - 1)
    
    for (let i = 0; i < columnMoves.length; i++) {
      const move = columnMoves[i]
      
      if (move < 0 || move > 6) {
        console.warn(`🔧 TOOLS: Invalid move ${moves[i]}, skipping`)
        continue
      }
      
      // Delay between moves for visual effect
      setTimeout(() => {
        if (!gameRef.current.gameOver) {
          handleColumnAttempt(move)
        }
      }, i * 500)
    }
  }, [handleColumnAttempt])
  
  // Handle move history navigation
  const handleMoveClick = useCallback((moveIndex: number) => {
    console.log("🔧 TOOLS: Navigating to move:", moveIndex)
    try {
      if (gameRef.current.setMoveIndex(moveIndex)) {
        setGameVersion(prev => prev + 1)
        updateAnalysis()
        console.log(`🔧 TOOLS: Successfully navigated to move ${moveIndex}`)
      }
    } catch (error) {
      console.error("Error navigating to move:", error)
    }
  }, [updateAnalysis])
  
  // Game control functions
  const handleResetGame = useCallback(() => {
    console.log("🔧 TOOLS: Resetting game")
    gameRef.current = new StandardGame()
    setGameOver(false)
    setGameVersion(prev => prev + 1)
    setAnalysis("Position evaluation loading...")
    analysisDataRef.current = ["Position evaluation loading..."]
    
    // Reinitialize analysis with new game
    if (analysisRef.current) {
      const reinitAnalysis = async () => {
        try {
          analysisRef.current = await SelfAnalysis.load(gameRef.current)
          updateAnalysis()
        } catch (error) {
          console.error("Failed to reinitialize analysis:", error)
          setAnalysis("Analysis unavailable after reset")
          analysisDataRef.current = ["Analysis unavailable after reset"]
        }
      }
      reinitAnalysis()
    }
    
    // Clear board animations
    unifiedLayoutRef.current?.clearPremove()
  }, [updateAnalysis])
  
  const handleToggleAnalysis = useCallback((enabled: boolean) => {
    console.log("🔧 TOOLS: Analysis toggled:", enabled)
  }, [])

  const handleSettingsClick = useCallback(() => {
    console.log("🔧 TOOLS: Settings clicked")
    // Could open a settings modal or trigger reset
    handleResetGame()
  }, [handleResetGame])

  const handleCloseOpening = useCallback(() => {
    setShowOpeningDescription(false)
  }, [])

  return (
    <UnifiedGameLayout
      ref={unifiedLayoutRef}
      board={{
        interactive: !gameOver,
        onColumnAttempt: handleColumnAttempt,
        boardState: gameRef.current.getBoard(),
        gameOver: gameOver,
        animate_init: false,
        ariaLabel: "Connect 4 analysis board",
        key: `board-${gameVersion}`, // Force re-render when game changes
      }}
      layout={{
        mode: "simple", // Use simple mode for board + content layout
        contentRatio: "50%", // Equal space for better analysis visibility
      }}
    >
      {/* Tool UI Component */}
      <div className="flex-1 min-h-0">
        <ToolUI
          key={`toolui-${gameVersion}`} // Force re-render when game changes
          game={gameRef.current}
          currentMoveIndex={gameRef.current.currentMoveIndex}
          showAnalysisFeatures={true}
          analysisData={analysisDataRef} // Pass the live analysis data ref
          evaluation={currentEvaluation} // Pass current evaluation for color coding
          columnEvaluations={columnEvaluationsRef} // Pass raw column evaluations
          showOpeningDescription={showOpeningDescription}
          openingName="Position Analysis"
          openingDescription={analysis}
          showEnterMoves={!showOpeningDescription}
          enterMovesDisabled={gameOver}
          enterMovesPlaceholder="Enter moves: 1-7 separated by spaces (e.g., 4 3 5 2 6)"
          onSubmitMoves={handleSubmitMoves}
          onMoveClick={handleMoveClick}
          onToggleAnalysis={handleToggleAnalysis}
          onSettingsClick={handleSettingsClick}
          onCloseOpening={handleCloseOpening}
          onColumnClick={handleColumnAttempt} // Pass column click handler
        />
      </div>
    </UnifiedGameLayout>
  )
}
