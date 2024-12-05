'use client'

import React, { useState, useEffect, useRef } from 'react'
import MoveHistory from '@/components/history'
import SinglePlayerGameboard from '@/components/singleplayer_gameboard'
import Dashboard from '@/components/dashboard'
import GameAnalysis from '@/components/analysis'
import { Analysis } from '@/utils/analysis'
import { GameState } from '@/utils/game'

export default function AnalysisPage() {
    let gameBoardRef = useRef<GameState>();
    gameBoardRef.current = new GameState();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Dashboard />
      <div className="flex-1 flex items-center justify-center p-4">
        <SinglePlayerGameboard ref={gameBoardRef.current} />
      </div>
      <div className="flex-1 items-center justify-center">
        <MoveHistory ref={gameBoardRef.current} />

        <GameAnalysis analysis={new Analysis(gameBoardRef.current)} />
      </div>
    </div>
  )
}