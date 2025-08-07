"use client"

import { useState } from "react"
import { GameBoardLayout } from "@/components/layouts/game-board-layout"
import { LiveGameSelection } from "@/components/game/LiveGameSelector"

export default function LiveGamePage() {
  // State for game board layout, managed here
  const [scoreRatio, setScoreRatio] = useState(0.5)
  return (
    <GameBoardLayout
      scoreRatio={scoreRatio}
      displayScoreBar={false} // Hide score bar on setup page
      onPauseGame={function (): void {
        throw new Error("Function not implemented.")
      } } onResetGame={function (): void {
        throw new Error("Function not implemented.")
      } }    >
      <LiveGameSelection />
    </GameBoardLayout>
  )
}

