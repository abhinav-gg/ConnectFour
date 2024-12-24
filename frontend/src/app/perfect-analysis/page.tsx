'use client'

import React, { useState, useEffect, useRef } from 'react'
import MoveHistory from '@/components/history'
import SinglePlayerGameboard from '@/components/singleplayer_gameboard'
import Dashboard from '@/components/dashboard'
//import { Analysis } from '@/utils/analysis'
import { GameState } from '@/utils/game'

export default function AnalysisPage() {
    const gameBoardRef = useRef<GameState>();
    gameBoardRef.current = new GameState();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Dashboard />
      <div className="flex-1 flex items-center justify-center p-4">
        <SinglePlayerGameboard ref={gameBoardRef.current} />
      </div>
      <div className="flex-1 items-center justify-center h-full">
        <div className="p-4">
        <MoveHistory ref={gameBoardRef.current} />
        </div><br/><br/>
        <div className="p-4">
        
        </div>
      </div>
    </div>
  )
} //<GameAnalysis analysis={new Analysis(gameBoardRef.current)} />