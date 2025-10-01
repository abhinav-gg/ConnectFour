"use client"

import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import { FallingCirclesBackground } from "@/components/bganimation"
import { BotSelectionUI } from "@/components/game/full-sides/BotSelector"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AllGameModes } from "@shared/constants/allgamemodes"

type PlayerColor = "red" | "random" | "yellow"

export default function LiveGamePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStartGame = async (selectedBot: string, playerColor: PlayerColor) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/game/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gamemode: AllGameModes.STANDARD_BOT_MATCH,
          time_control: {
            base_time: 300000, // 5 minutes
            increment: 0,
            disadvantage: 0
          },
          botId: selectedBot,
          playerColor: playerColor
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(data.gameLink)
      } else {
        console.error('Failed to create bot game:', response.statusText)
        // Handle error - could show a toast or error message
      }
    } catch (error) {
      console.error('Error creating bot game:', error)
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

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
        <BotSelectionUI onStartGame={handleStartGame} isLoading={isLoading} />
      </UnifiedGameLayout>
    </>
  )
}

