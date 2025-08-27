"use client"

import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import { LiveGameSelection } from "@/components/game/LiveGameSelector"
import { FallingCirclesBackground } from "@/components/bganimation"

export default function LiveGamePage() {
  return (
    <>
      <FallingCirclesBackground />
      <UnifiedGameLayout
        board={{
          interactive: false, // Board is not interactive on setup page
          animate_init: false,
        }}
        layout={{
          showScoreBar: false,
          showTimers: false,
          showPlayerInfo: false,
          contentRatio: "50%", // 50/50 split between board and content
        }}
      >
        <LiveGameSelection />
      </UnifiedGameLayout>
    </>
  )
}

