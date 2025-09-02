"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { HelpCircle, Flag, Star, Bot } from "lucide-react"

interface BotMessage {
  id: string
  text: string
  timestamp: Date
}

interface BotPlayProps {
  botName?: string
  botAvatar?: string
  onHint?: () => void
  onResign?: () => void
  className?: string
}

interface FallingStar {
  id: string
  startX: number
  startY: number
}

export function BotPlay({ botName = "Victor Bot", botAvatar, onHint, onResign, className = "" }: BotPlayProps) {
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: "1",
      text: "Welcome! I'm ready to play. You have 2 hints available.",
      timestamp: new Date(Date.now() - 60000),
    },
  ])

  const [hintsUsed, setHintsUsed] = useState(0) // 0 = 3 stars, 1 = 2 stars, 2 = 1 star
  const [fallingStars, setFallingStars] = useState<FallingStar[]>([])
  const [isHintDisabled, setIsHintDisabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const maxHints = 2 // Can use 2 hints, leaving 1 star minimum

  // Auto-scroll to top when new messages are added (since newest is at top)
  const scrollToTop = () => {
    const container = messagesEndRef.current?.parentElement
    if (container) {
      container.scrollTop = 0
    }
  }

  useEffect(() => {
    scrollToTop()
  }, [messages])

  // Simulate bot sending initial message
  useEffect(() => {
    const timer = setTimeout(() => {
      const newMessage: BotMessage = {
        id: Date.now().toString(),
        text: "Make your move! Remember, you can ask for hints if you need help.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const addBotMessage = (text: string) => {
    const newMessage: BotMessage = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const createFallingStar = (starIndex: number) => {
    // Get the position of the star that's about to fall
    const starElement = document.querySelector(`[data-star-index="${starIndex}"]`)
    if (starElement) {
      const rect = starElement.getBoundingClientRect()
      const fallingStar: FallingStar = {
        id: `falling-${Date.now()}-${starIndex}`,
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
      }

      setFallingStars((prev) => [...prev, fallingStar])

      // Remove the falling star after animation completes
      setTimeout(() => {
        setFallingStars((prev) => prev.filter((star) => star.id !== fallingStar.id))
      }, 2000)
    }
  }

  const handleHint = () => {
    if (hintsUsed >= maxHints) return

    setIsHintDisabled(true)

    // Create falling star animation for the star that's about to disappear
    const starToFall = 3 - hintsUsed - 1 // Index of the star that will fall (0, 1, or 2)
    createFallingStar(starToFall)

    // Immediately update hints (no delay) so empty star appears right away
    setHintsUsed((prev) => prev + 1)

    setTimeout(() => {
      setIsHintDisabled(false)
    }, 500)

    onHint?.()

    // Bot responses based on hints used
    const hintMessages = [
      "Try looking at column 4 - there might be a good opportunity there! You have 1 hint remaining.",
      "Consider blocking your opponent's potential win in column 2. This was your last hint!",
    ]

    setTimeout(() => {
      addBotMessage(hintMessages[hintsUsed] || "No more hints available!")
    }, 1000)
  }

  const handleResign = () => {
    onResign?.()
    addBotMessage("Good game! Thanks for playing with me.")
  }

  const renderStars = () => {
    const starsRemaining = 3 - hintsUsed

    return (
      <div className="flex gap-1 relative">
        {[1, 2, 3].map((starNumber) => {
          const starIndex = starNumber - 1
          const isFilled = starNumber <= starsRemaining

          return (
            <motion.div
              key={starNumber}
              data-star-index={starIndex}
              initial={{ scale: 1 }}
              animate={{
                scale: isFilled ? 1 : 0.9,
                opacity: isFilled ? 1 : 0.4,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.1 }}
            >
              <Star
                className={`w-6 h-6 lg:w-8 lg:h-8 transition-all duration-100 ${
                  isFilled
                    ? "text-yellow-400 fill-yellow-400 drop-shadow-lg"
                    : "text-yellow-400/40 stroke-yellow-400/40 fill-transparent stroke-2"
                }`}
              />
            </motion.div>
          )
        })}
      </div>
    )
  }

  const getBotAvatar = () => {
    if (botAvatar) {
      return (
        <img
          src={botAvatar || "/placeholder.svg"}
          alt={`${botName} avatar`}
          className="w-full h-full object-cover rounded-lg"
        />
      )
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-transparent rounded-lg" />
        <Bot className="w-8 h-8 lg:w-10 lg:h-10 text-purple-300" />
        <div className="absolute bottom-1 right-1">
          <Star className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-400 fill-yellow-400" />
        </div>
      </div>
    )
  }

  // Reverse messages so newest appears first (at top)
  const reversedMessages = [...messages].reverse()

  return (
    <div className={`flex flex-col h-full text-white relative ${className}`}>
      {/* Falling Stars Portal */}
      <AnimatePresence>
        {fallingStars.map((star) => (
          <motion.div
            key={star.id}
            className="fixed pointer-events-none z-[9999]"
            style={{
              left: star.startX - 12, // Center the star (assuming 24px width)
              top: star.startY - 12, // Center the star (assuming 24px height)
            }}
            initial={{
              scale: 1,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: window.innerHeight + 100,
              x: Math.random() * 200 - 100, // Random horizontal drift
              rotate: 720, // Two full rotations
              scale: 0.5,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for natural fall
            }}
          >
            <Star className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-4 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl lg:text-2xl font-bold text-white">{botName}</h2>
        {renderStars()}
      </motion.div>

      {/* Messages Area - Fixed height container with scrolling */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {/* Bot Avatar - Fixed position, centered vertically in the messages area */}
        <div className="absolute top-8 left-0 w-10 h-10 lg:w-12 lg:h-12 z-10">{getBotAvatar()}</div>

        <div
          className="overflow-y-auto scrollbar-custom pr-2 pl-12 lg:pl-14"
          style={{
            height: "calc(5.5 * 4rem)", // Approximately 5-6 lines of text height
            maxHeight: "calc(5.5 * 4rem)",
          }}
        >
          <div ref={messagesEndRef} />
          {/* Negative top margin to move first message higher, allowing it to appear above bot center */}
          <div className="-mt-4">
            {reversedMessages.map((message, index) => {
              const isLatest = index === 0 // First in reversed array is the latest
              return (
                <motion.div
                  key={message.id}
                  className={`relative ${index < reversedMessages.length - 1 ? "mb-3" : ""}`} // Add margin bottom except for last message
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: 0.1,
                  }}
                  layout="position"
                >
                  {/* Message Bubble */}
                  <motion.div
                    className="bg-gray-800/90 backdrop-blur-sm rounded-2xl px-3 py-2 lg:px-4 lg:py-3 shadow-lg border border-gray-700/50 relative"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {/* Speech bubble tail for latest message - positioned to center with bot avatar */}
                    {isLatest && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full">
                        <div
                          className="w-0 h-0 border-solid"
                          style={{
                            borderTop: "10px solid transparent",
                            borderBottom: "10px solid transparent",
                            borderRight: "12px solid rgba(31, 41, 55, 0.9)", // matches bg-gray-800/90
                            filter: "drop-shadow(-1px 0 0 rgba(55, 65, 81, 0.5))", // matches border color
                          }}
                        />
                      </div>
                    )}

                    <p className="text-white text-sm lg:text-base font-medium leading-relaxed">{message.text}</p>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <motion.div
        className="flex gap-3 lg:gap-4 mt-4 flex-shrink-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleHint}
            disabled={hintsUsed >= maxHints || isHintDisabled}
            variant="secondary"
            size="lg"
            className={`
              w-full h-10 lg:h-12 text-sm lg:text-base rounded-2xl transition-all duration-200 
              flex items-center justify-center gap-2
              ${
                hintsUsed >= maxHints
                  ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  : "bg-slate-600/80 hover:bg-slate-600 text-white"
              }
            `}
          >
            <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5" />
            hint {hintsUsed >= maxHints ? "(used)" : `(${maxHints - hintsUsed} left)`}
          </Button>
        </motion.div>

        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleResign}
            variant="secondary"
            size="lg"
            className="w-full h-10 lg:h-12 text-sm lg:text-base bg-slate-600/80 hover:bg-slate-600 text-white rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Flag className="w-4 h-4 lg:w-5 lg:h-5" />
            resign
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
