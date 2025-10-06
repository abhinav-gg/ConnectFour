"use client"

import { useRef, useImperativeHandle, forwardRef } from "react"
import { BaseGameUI, BaseGameUIProps, GameUIRef } from "./BaseGameUI"
import { BotPlay } from "@/components/game/utility/bot-play"
import { logger } from '@/utils/logger'

export interface BotGameRef extends GameUIRef {
  sendBotMessage: (message: string) => void
}

interface BotGameUIProps extends Omit<BaseGameUIProps, 'children' | 'isBotMode'> {
  // Bot-specific props
  onHint?: () => void
  botName?: string
  botAvatar?: string
}

const BotGameUI = forwardRef<BotGameRef, BotGameUIProps>((props, ref) => {
  const {
    onHint,
    botName,
    botAvatar,
    meRef,
    opponentRef,
    ...baseProps
  } = props
  
  // Get bot info from props or refs
  const actualBotName = botName || opponentRef?.current?.username || "Bot"
  const actualBotAvatar = botAvatar || opponentRef?.current?.pfp

  const handleHint = () => {
    logger.bot('BOT: Hint requested')
    onHint?.()
  }

  // Expose bot-specific methods to parent component
  useImperativeHandle(ref, () => ({
    sendBotMessage: (message: string) => {
      logger.bot("Sending bot message:", message)
      // This could be extended to manage bot messages if needed
    }
  }), [])

  return (
    <BaseGameUI
      {...baseProps}
      meRef={meRef}
      opponentRef={opponentRef}
      isBotMode={true}
    >
      {/* Bot Play content slot */}
      <BotPlay 
        botName={actualBotName}
        botAvatar={actualBotAvatar}
        onHint={handleHint}
        onResign={baseProps.onResign}
        className="h-full"
      />
    </BaseGameUI>
  )
})

BotGameUI.displayName = "BotGameUI"
export default BotGameUI