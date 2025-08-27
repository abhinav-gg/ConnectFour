"use client"

import { FallingCirclesBackground } from "@/components/bganimation"
import { UnifiedGameLayout } from "../../components/layouts/game-layout"
import { GameSelect } from "@/components/game/pick-game"

export default function GameSetupPage() {
  return (
    <>
      <FallingCirclesBackground />
      <UnifiedGameLayout
        board={{
          interactive: false, // Board is not interactive on this setup page
          animate_init: false,
        }}
        layout={{
          showScoreBar: false,
          showTimers: false,
          showPlayerInfo: false,
          contentRatio: "50%", // Board vs content ratio
        }}
      >
        <GameSelect />
      </UnifiedGameLayout>
    </>
  )
}
