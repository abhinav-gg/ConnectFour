"use client"

import React, { useRef, useState } from "react"
import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import { StandardGame } from "@shared/utils/Games/game"
import { PlayerData } from "@shared/types/users"

export default function TestLayoutPage() {
  const gameRef = useRef(new StandardGame())
  const [layoutMode, setLayoutMode] = useState<"simple" | "full-game">("simple")
  const [showComponents, setShowComponents] = useState({
    board: true,
    scoreBar: false,
    timers: false,
    playerInfo: false,
  })
  const [headerText, setHeaderText] = useState("Test Game Header")
  const [contentRatio, setContentRatio] = useState<"50%" | "66%">("66%")

  // Mock player data
  const player1: PlayerData = {
    username: "TestPlayer1",
    time: 280000,
    pfp: undefined
  }
  
  const player2: PlayerData = {
    username: "TestPlayer2", 
    time: 250000,
    pfp: undefined
  }

  const handleColumnAttempt = (col: number) => {
    const result = gameRef.current.makeMove(col)
    if (result.success) {
      console.log(`Move made in column ${col + 1}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Control Panel */}
      <div className="fixed top-4 right-4 z-50 bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 className="text-white font-bold mb-3">Layout Controls</h3>
        
        {/* Layout Mode */}
        <div className="mb-3">
          <label className="text-white text-sm block mb-1">Mode:</label>
          <select 
            value={layoutMode} 
            onChange={(e) => setLayoutMode(e.target.value as "simple" | "full-game")}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1"
          >
            <option value="simple">Simple</option>
            <option value="full-game">Full Game</option>
          </select>
        </div>

        {/* Content Ratio */}
        <div className="mb-3">
          <label className="text-white text-sm block mb-1">Content Ratio:</label>
          <select 
            value={contentRatio} 
            onChange={(e) => setContentRatio(e.target.value as "50%" | "66%")}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1"
          >
            <option value="66%">66% Board</option>
            <option value="50%">50% Board</option>
          </select>
        </div>

        {/* Header Text */}
        <div className="mb-3">
          <label className="text-white text-sm block mb-1">Header Text:</label>
          <input 
            type="text"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1 w-full"
            placeholder="Enter header text"
          />
        </div>

        {/* Component Toggles */}
        <div className="space-y-2">
          <label className="flex items-center text-white text-sm">
            <input 
              type="checkbox" 
              checked={showComponents.board}
              onChange={(e) => setShowComponents(prev => ({ ...prev, board: e.target.checked }))}
              className="mr-2"
            />
            Show Board
          </label>
          
          <label className="flex items-center text-white text-sm">
            <input 
              type="checkbox" 
              checked={showComponents.scoreBar}
              onChange={(e) => setShowComponents(prev => ({ ...prev, scoreBar: e.target.checked }))}
              className="mr-2"
            />
            Score Bar
          </label>
          
          <label className="flex items-center text-white text-sm">
            <input 
              type="checkbox" 
              checked={showComponents.timers}
              onChange={(e) => setShowComponents(prev => ({ ...prev, timers: e.target.checked }))}
              className="mr-2"
            />
            Timers
          </label>
          
          <label className="flex items-center text-white text-sm">
            <input 
              type="checkbox" 
              checked={showComponents.playerInfo}
              onChange={(e) => setShowComponents(prev => ({ ...prev, playerInfo: e.target.checked }))}
              className="mr-2"
            />
            Player Info
          </label>
        </div>
      </div>

      {/* Layout Test */}
      <UnifiedGameLayout
        board={{
          showBoard: showComponents.board,
          interactive: true,
          onColumnAttempt: handleColumnAttempt,
          boardState: gameRef.current.getBoard(),
          gameOver: gameRef.current.gameOver,
        }}
        gameState={{
          scoreRatio: 0.3,
          isGameRunning: true,
          player1: player1,
          player2: player2,
          player1Time: player1.time,
          player2Time: player2.time,
          currentTurn: 0,
          player1IsRed: false,
        }}
        layout={{
          mode: layoutMode,
          showScoreBar: showComponents.scoreBar,
          showTimers: showComponents.timers,
          showPlayerInfo: showComponents.playerInfo,
          headerText: headerText || undefined,
          contentRatio: contentRatio,
        }}
        onTimeUp={() => console.log("Time up!")}
        onBoardReady={() => console.log("Board ready!")}
      >
        {/* Content Section */}
        <div className="flex flex-col h-full">
          <h1 className="text-3xl font-bold text-white mb-4">
            Unified Layout Test
          </h1>
          
          <div className="flex-1 bg-gray-700/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Test Content Area
            </h2>
            
            <div className="space-y-4 text-white">
              <p>
                <strong>Current Mode:</strong> {layoutMode}
              </p>
              <p>
                <strong>Content Ratio:</strong> {contentRatio}
              </p>
              <p>
                <strong>Header Text:</strong> {headerText || "None"}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Enabled Features:</h3>
                  <ul className="space-y-1">
                    {Object.entries(showComponents).map(([key, enabled]) => (
                      <li key={key} className={enabled ? "text-green-400" : "text-red-400"}>
                        {key}: {enabled ? "✓" : "✗"}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Game State:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>Moves: {gameRef.current.getMoves().length}</li>
                    <li>Current Player: {gameRef.current.currentPlayer === 0 ? "Yellow" : "Red"}</li>
                    <li>Game Over: {gameRef.current.gameOver ? "Yes" : "No"}</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-600/50 rounded">
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Use the control panel to toggle layout modes and features</li>
                  <li>• Click on the board to make moves (when enabled)</li>
                  <li>• Switch between simple and full-game modes</li>
                  <li>• Test responsivity by resizing the window</li>
                  <li>• Modify header text and content ratios</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </UnifiedGameLayout>
    </div>
  )
}
