"use client"

import { BoardSpaceLayout } from "../../components/layouts/board-space-layout"
import { GameSelect } from "@/components/game/pick-game"

export default function GameSetupPage() {
  return (
    <BoardSpaceLayout
      boardProps={{
        interactive: false, // Board is not interactive on this setup page
        animate_init: false,
      }}
      boardColumnRatio="50%"
    >
      <GameSelect />
    </BoardSpaceLayout>
  )
}
