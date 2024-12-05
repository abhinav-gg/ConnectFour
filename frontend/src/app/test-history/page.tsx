'use client'

import React, { useRef } from "react"
import MoveHistory from "@/components/history"
import SinglePlayerGameboard from "@/components/singleplayer_gameboard"
import Dashboard from "@/components/dashboard"
import { GameState } from "@/utils/game"

export default function TestHistoryPage() {
  let gameBoardRef = useRef<GameState>();
  gameBoardRef.current = new GameState();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Dashboard />
      <div className="flex-1 flex items-center justify-center p-4">
        <SinglePlayerGameboard ref={gameBoardRef.current} />
      </div>
      <div className="flex-1 items-center justify-center">
        <MoveHistory 
          ref={gameBoardRef.current}
        />
      </div>
    </div>
  )
}