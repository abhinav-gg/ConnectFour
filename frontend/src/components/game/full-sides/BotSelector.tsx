"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Bot, Star, Lock, Check } from "lucide-react"
import { Bots, BotType } from "@shared/constants/botinfo"

type PlayerColor = "red" | "random" | "yellow"

interface BotSelectionUIProps {
  onStartGame?: (selectedBot: string, playerColor: PlayerColor) => void
  isLoading?: boolean
}

export function BotSelectionUI({ onStartGame, isLoading = false }: BotSelectionUIProps) {
  const [selectedBot, setSelectedBot] = useState<string>("adaptive")
  const [selectedColor, setSelectedColor] = useState<PlayerColor>("red")

  const selectedBotData = Bots.find((bot) => bot.id === selectedBot)

  const handleBotSelect = (botId: string) => {
    setSelectedBot(botId)
  }

  const handleColorSelect = (color: PlayerColor) => {
    setSelectedColor(color)
  }

  const handleStartGame = () => {
    onStartGame?.(selectedBot, selectedColor)
  }

  const renderStars = (rating: number) => {
    // Convert rating to difficulty stars (1-3)
    let difficulty = 1
    if (rating >= 1400) difficulty = 3
    else if (rating >= 800) difficulty = 2

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

  const getBotAvatar = (bot: BotType) => {
    const baseClasses = "w-12 h-12 rounded-xl flex items-center justify-center text-lg relative"
    
    // Get color based on rating
    let colorClass = "bg-green-500"
    if (bot.rating >= 1800) colorClass = "bg-orange-500"
    else if (bot.rating >= 1400) colorClass = "bg-red-500"
    else if (bot.rating >= 1000) colorClass = "bg-blue-500"
    else if (bot.rating >= 800) colorClass = "bg-purple-500"
    else if (bot.rating >= 600) colorClass = "bg-teal-500"

    return (
      <div className={`${baseClasses} ${colorClass}`}>
        <div className="text-white">
          <Bot className="w-6 h-6" />
        </div>
        {bot.isPro && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-white" />
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
      <div className="flex items-center justify-center gap-2">
        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Play Bots</h1>
      </div>

      {/* Selected Bot Info */}
      <AnimatePresence mode="wait">
        {selectedBotData && (
          <motion.div
            key={`${selectedBot}-info`}
            className="bg-slate-600/80 rounded-xl p-4 space-y-3 min-h-[120px]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getBotAvatar(selectedBotData)}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">{selectedBotData.name}</h2>
                    {renderStars(selectedBotData.rating)}
                  </div>
                  <p className="text-gray-400 text-sm">{selectedBotData.rating}</p>
                </div>
              </div>
            </div>
            <div className="min-h-[48px] flex items-start">
              <p className="text-slate-200 text-sm leading-relaxed line-clamp-2">
                {selectedBotData.detailedDescription}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bot Selection Grid */}
      <div className="relative flex-1 min-h-0">
        <div className="h-full overflow-y-auto scrollbar-custom p-3 pt-4">
          {isLoading ? (
            // Loading animation
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="aspect-square w-full bg-slate-600/50 rounded-xl animate-pulse" />
                  <div className="h-4 w-12 bg-slate-600/50 rounded animate-pulse" />
                </motion.div>
              ))}
            </div>
          ) : (
            // Bot grid
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {Bots.map((bot, index) => (
                <motion.div
                  key={bot.id}
                  className="flex flex-col items-center space-y-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <motion.button
                    onClick={() => !bot.isPro && handleBotSelect(bot.id)}
                    disabled={bot.isPro}
                    className={`
                      aspect-square w-full rounded-xl transition-all duration-200 relative
                      ${bot.isPro ? "cursor-not-allowed opacity-60" : "hover:scale-105 cursor-pointer"}
                      ${
                        selectedBot === bot.id && !bot.isPro
                          ? "ring-2 ring-green-500"
                          : !bot.isPro ? "hover:ring-1 hover:ring-slate-400" : ""
                      }
                    `}
                    whileHover={!bot.isPro ? { scale: 1.05 } : {}}
                    whileTap={!bot.isPro ? { scale: 0.95 } : {}}
                  >
                    <motion.div
                      animate={selectedBot === bot.id && !bot.isPro ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`w-full h-full rounded-xl flex items-center justify-center relative ${bot.isPro ? "grayscale" : ""}`}
                      style={{
                        background: (() => {
                          if (bot.rating >= 1800) return "#f97316" // orange-500
                          if (bot.rating >= 1400) return "#ef4444" // red-500
                          if (bot.rating >= 1000) return "#3b82f6" // blue-500
                          if (bot.rating >= 800) return "#8b5cf6" // purple-500
                          if (bot.rating >= 600) return "#14b8a6" // teal-500
                          return "#22c55e" // green-500
                        })()
                      }}
                    >
                      <Bot className="w-6 h-6 text-white" />
                      
                      {/* Lock overlay for pro bots */}
                      {bot.isPro && (
                        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                          <Lock className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white/90 drop-shadow-sm" strokeWidth={1.5} />
                        </div>
                      )}
                    </motion.div>

                    {/* Selection indicator - only for non-pro bots */}
                    {selectedBot === bot.id && !bot.isPro && (
                      <motion.div
                        className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        style={{
                          boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.2)"
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.button>
                  
                  {/* Bot Name */}
                  <span className="text-xs text-center text-slate-300 font-medium leading-tight max-w-full truncate px-1">
                    {bot.name}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Color Selection */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h3 className="text-lg font-medium text-center">I play as:</h3>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => handleColorSelect("red")}
            className={`
              w-12 h-12 rounded-full bg-brand-accent-red flex items-center justify-center
              transition-all duration-200 hover:scale-110
              ${selectedColor === "red" ? "ring-3 ring-white/50" : ""}
            `}
          >
            {selectedColor === "red" && <Check className="w-6 h-6 text-white" strokeWidth={3} />}
          </button>
          <button
            onClick={() => handleColorSelect("random")}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center overflow-hidden
              transition-all duration-200 hover:scale-110
              ${selectedColor === "random" ? "ring-3 ring-white/50" : ""}
            `}
            style={{
              background: "linear-gradient(90deg, #E63946 50%, #eab308 50%)",
            }}
          >
            {selectedColor === "random" && <Check className="w-6 h-6 text-white" strokeWidth={3} />}
          </button>
          <button
            onClick={() => handleColorSelect("yellow")}
            className={`
              w-12 h-12 rounded-full bg-brand-accent-yellow flex items-center justify-center
              transition-all duration-200 hover:scale-110
              ${selectedColor === "yellow" ? "ring-3 ring-white/50" : ""}
            `}
          >
            {selectedColor === "yellow" && <Check className="w-6 h-6 text-white" strokeWidth={3} />}
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
          disabled={isLoading}
          className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Start Game"}
        </Button>
      </motion.div>
    </motion.div>
  )
}
