'use client'

import React, { useRef } from "react"
import MoveHistory from "@/components/history"
import SinglePlayerGameboard from "@/components/singleplayer_gameboard"
import Dashboard from "@/components/dashboard"

export default function TestHistoryPage() {
  const gameBoardRef = useRef<any>(null);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Dashboard />
      <div className="flex-1 flex items-center justify-center p-4">
        <SinglePlayerGameboard ref={gameBoardRef} />
      </div>
      <MoveHistory 
              gameState={gameBoardRef.current?.gameState}
        />
    </div>
  )
}