"use client"

import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import { FallingCirclesBackground } from "@/components/bganimation"
import { BotSelectionUI } from "@/components/game/full-sides/BotSelector"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AllGameModes } from "@shared/constants/allgamemodes"
import { gameApi } from "@/utils/apiClient"
import { logger } from '@/utils/logger'
import { useError } from "@/components/providers/ErrorProvider"
import { useRecaptcha } from "@/components/providers/RecaptchaProvider"
import { TimeControl, PlayAs } from "@shared/types/game.types"

export default function LiveGamePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { showWarning, showError } = useError()
  const { getRecaptchaToken, activateRecaptcha, isRecaptchaActive } = useRecaptcha()

  useEffect(() => {
    activateRecaptcha();
  }, [activateRecaptcha]);

  const handleStartGame = async (selectedBot: string, playerColor: PlayAs) => {
    setIsLoading(true)
    
    try {
      logger.bot('Creating bot game:', { selectedBot, playerColor });
      
      // Get reCAPTCHA token for verification
      const recaptchaToken = await getRecaptchaToken('bot_game_request');
      if (!recaptchaToken || !isRecaptchaActive) {
        showWarning('reCAPTCHA verification failed. Please try again.', 5);
        setIsLoading(false);
        return;
      }
      
      const response = await gameApi.post<{ gameLink: string }>('/request', {
        gamemode: AllGameModes.STANDARD_BOT_MATCH,
        time_control: {
          base_time: 180, // 3 minutes
          increment: 2, // 2 seconds
          disadvantage: 0 // 0 seconds
        } as TimeControl,
        botId: selectedBot,
        playerColor: playerColor,
        recaptchaToken: recaptchaToken
      });

      if (response.success && response.data) {
        logger.bot('Bot game created successfully:', response.data);
        router.push(response.data.gameLink)
      } else {
        console.error('🤖 Failed to create bot game:', response.error)
        showError(`Failed to create bot game: ${response.error}`, "error", 8000)
      }
    } catch (error) {
      console.error('🤖 Error creating bot game:', error)
      showError('An unexpected error occurred while creating the bot game.', "error", 8000)
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

