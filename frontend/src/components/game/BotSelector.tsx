"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Bot, Info, Star, Lock, Check } from "lucide-react"

type BotType = "random" | "adaptive" | "expert" | "victor" | "beginner" | "intermediate" | "master"
type PlayerColor = "red" | "random" | "yellow"

interface BotOption {
  id: BotType
  name: string
  description: string
  detailedDescription: string
  difficulty: number
  rating: number
  color: string
  isPro?: boolean
  avatar: string
}

interface BotSelectionUIProps {
  onStartGame?: (selectedBot: BotType, playerColor: PlayerColor) => void
  onInfoClick?: () => void
}

export function BotSelectionUI({ onStartGame, onInfoClick }: BotSelectionUIProps) {
  const [selectedBot, setSelectedBot] = useState<BotType>("adaptive")
  const [selectedColor, setSelectedColor] = useState<PlayerColor>("red")

  const bots: BotOption[] = [
    {
      id: "random",
      name: "Random",
      description: "Makes random moves",
      detailedDescription:
        "This bot makes completely random moves. Great for beginners who want to practice without pressure.",
      difficulty: 1,
      rating: 400,
      color: "bg-yellow-500",
      avatar: "🤖",
    },
    {
      id: "adaptive",
      name: "Adaptive",
      description: "Learns from your moves",
      detailedDescription:
        "This is the adaptive bot that is capable of responding to your moves at a similar skill level. Best used for training.",
      difficulty: 2,
      rating: 1000,
      color: "bg-red-500",
      avatar: "🤖",
    },
    {
      id: "expert",
      name: "Expert (pro)",
      description: "Advanced AI opponent",
      detailedDescription:
        "A highly advanced AI that uses sophisticated algorithms to provide a challenging experience for experienced players.",
      difficulty: 3,
      rating: 1800,
      color: "bg-teal-500",
      avatar: "🤖",
      isPro: true,
    },
    {
      id: "victor",
      name: "Victor",
      description: "Competitive AI",
      detailedDescription:
        "Victor is a competitive AI designed to play at tournament level. Expect no mercy from this opponent.",
      difficulty: 3,
      rating: 1650,
      color: "bg-blue-500",
      avatar: "🤖",
    },
    {
      id: "beginner",
      name: "Beginner",
      description: "Easy opponent for new players",
      detailedDescription:
        "Perfect for players just starting out. Makes simple moves and occasional mistakes to help you learn.",
      difficulty: 1,
      rating: 600,
      color: "bg-green-500",
      avatar: "🤖",
    },
    {
      id: "intermediate",
      name: "Intermediate",
      description: "Balanced gameplay",
      detailedDescription:
        "A well-balanced opponent that provides moderate challenge while still being approachable for most players.",
      difficulty: 2,
      rating: 1200,
      color: "bg-purple-500",
      avatar: "🤖",
    },
    {
      id: "master",
      name: "Master",
      description: "Ultimate challenge",
      detailedDescription:
        "The ultimate Connect 4 AI. Only attempt if you're ready for the most challenging opponent available.",
      difficulty: 3,
      rating: 2000,
      color: "bg-orange-500",
      avatar: "🤖",
      isPro: true,
    },
  ]

  const selectedBotData = bots.find((bot) => bot.id === selectedBot)

  const handleBotSelect = (botId: BotType) => {
    setSelectedBot(botId)
  }

  const handleColorSelect = (color: PlayerColor) => {
    setSelectedColor(color)
  }

  const handleStartGame = () => {
    onStartGame?.(selectedBot, selectedColor)
  }

  const renderStars = (difficulty: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= difficulty ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`}
          />
        ))}
      </div>
    )
  }

  const getBotAvatar = (bot: BotOption) => {
    const baseClasses = "w-16 h-16 rounded-xl flex items-center justify-center text-2xl relative"

    return (
      <div className={`${baseClasses} ${bot.color}`}>
        <div className="text-white">
          <Bot className="w-8 h-8" />
        </div>
        {bot.isPro && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center">
            <Lock className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6 text-white h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Play Bots</h1>
      </div>

      {/* Selected Bot Info */}
      <AnimatePresence mode="wait">
        {selectedBotData && (
          <motion.div
            key={`${selectedBot}-info`}
            className="bg-slate-600/80 rounded-2xl p-6 space-y-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {getBotAvatar(selectedBotData)}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold">{selectedBotData.name}</h2>
                    {renderStars(selectedBotData.difficulty)}
                  </div>
                  <p className="text-gray-400 text-lg">{selectedBotData.rating}</p>
                </div>
              </div>
            </div>
            <p className="text-slate-200 text-lg leading-relaxed">{selectedBotData.detailedDescription}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bot Selection with Info Button */}
      <div className="relative flex-1 min-h-0">
        {/* Info Button - Overlapping top right corner */}
        <div className="absolute top-0 right-0 z-20 transform translate-x-2 -translate-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onInfoClick}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-800 shadow-lg"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>

        <div className="h-full overflow-y-auto scrollbar-custom pl-2 pr-4 space-y-3" style={{ maxHeight: "200px" }}>
          {bots.map((bot, index) => (
            <motion.button
              key={bot.id}
              onClick={() => handleBotSelect(bot.id)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200
                ${
                  selectedBot === bot.id
                    ? "bg-slate-600/80 ring-2 ring-green-500"
                    : "bg-slate-600/50 hover:bg-slate-600/70"
                }
              `}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={selectedBot === bot.id ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {getBotAvatar(bot)}
              </motion.div>
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-semibold">{bot.name}</h3>
              </div>
              {renderStars(bot.difficulty)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h3 className="text-xl font-medium text-center">I play as:</h3>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleColorSelect("red")}
            className={`
              w-16 h-16 rounded-full bg-brand-accent-red flex items-center justify-center
              transition-all duration-200 hover:scale-110
              ${selectedColor === "red" ? "ring-4 ring-white/50" : ""}
            `}
          >
            {selectedColor === "red" && <Check className="w-8 h-8 text-white" strokeWidth={3} />}
          </button>
          <button
            onClick={() => handleColorSelect("random")}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center overflow-hidden
              transition-all duration-200 hover:scale-110
              ${selectedColor === "random" ? "ring-4 ring-white/50" : ""}
            `}
            style={{
              background: "linear-gradient(90deg, #E63946 50%, #eab308 50%)",
            }}
          >
            {selectedColor === "random" && <Check className="w-8 h-8 text-white" strokeWidth={3} />}
          </button>
          <button
            onClick={() => handleColorSelect("yellow")}
            className={`
              w-16 h-16 rounded-full bg-brand-accent-yellow flex items-center justify-center
              transition-all duration-200 hover:scale-110
              ${selectedColor === "yellow" ? "ring-4 ring-white/50" : ""}
            `}
          >
            {selectedColor === "yellow" && <Check className="w-8 h-8 text-white" strokeWidth={3} />}
          </button>
        </div>
      </motion.div>

      {/* Start Game Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Button
          onClick={handleStartGame}
          className="w-full h-16 text-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
        >
          Start Game
        </Button>
      </motion.div>
    </motion.div>
  )
}
