"use client"

import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import { FallingCirclesBackground } from "@/components/bganimation"
import { BotSelectionUI } from "@/components/game/full-sides/BotSelector"
import { useState } from "react"

export default function LiveGamePage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <>
      <FallingCirclesBackground />
      <UnifiedGameLayout
        board={{
          boardState: [
            [1, null, null, null, null, null, 13],
            [1, null, null, null, null, 13, 13],
            [1, null, null, null, null, null, 13],
            [1, 1, 1, 12, 12, 12, 13],
            [1, null, 1, 12, null, 12, 13],
            [1, 1, 1, 12, 12, 12, 13],
        ],
          interactive: false, // Board is not interactive on setup page
          animate_init: true,
        }}
        layout={{
          showScoreBar: false,
          showTimers: false,
          showPlayerInfo: false,
          contentRatio: "66%", // Give more space to content for the grid
        }}
      >
        <BotSelectionUI isLoading={isLoading} />
      </UnifiedGameLayout>
    </>
  )
}

