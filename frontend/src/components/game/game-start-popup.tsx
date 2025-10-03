"use client"

import type React from "react"

import { useState, useEffect, type MutableRefObject } from "react"
import { Button } from "@/components/ui/button"
import { TreePine, Rocket, Copy, Check, Swords, Clock, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { PlayerData } from "@shared/types/users"
import { GameInfo } from "@shared/types/game.types"
import { CategoriseTime } from "@shared/utils/gamemodes"
import { logger } from "@/utils/logger"

interface GameStartModalProps {
  open: boolean
  gameinfo?: GameInfo | null
  gameMode?: string
  timeControl?: string
  gameUrl?: string
  onCancel: () => void
  meRef: MutableRefObject<PlayerData | undefined>
  opponentRef: MutableRefObject<PlayerData | undefined>
  forceUpdateTrigger?: number
  isLoadingGameData?: boolean
}

export function GameStartModal({
  open,
  gameinfo,
  gameMode: propGameMode,
  timeControl: propTimeControl,
  gameUrl,
  onCancel,
  meRef,
  opponentRef,
  forceUpdateTrigger,
  isLoadingGameData = false,
}: GameStartModalProps) {
  const [copied, setCopied] = useState(false)
  const [showMatchFound, setShowMatchFound] = useState(false)
  const [gameMode, setGameMode] = useState("Loading..")
  const [timeControl, setTimeControl] = useState("Loading..")

  useEffect(() => {
    const hasOpponentData = open && opponentRef.current?.username
    setShowMatchFound(!!hasOpponentData)
  }, [open, forceUpdateTrigger])
  
  useEffect(() => {
    // Use props if provided, otherwise derive from gameinfo or use defaults
    if (propGameMode) {
      setGameMode(propGameMode)
    } else {
      setGameMode("Casual")
    }
    
    if (propTimeControl) {
      setTimeControl(propTimeControl)
    } else if (gameinfo) {
      const category = CategoriseTime(gameinfo.time_control)
      setTimeControl(category.charAt(0).toUpperCase() + category.slice(1))
    } else {
      setTimeControl("Bullet")
    }
    
    logger.game('GAME INFO:', gameinfo)
  }, [open, forceUpdateTrigger, gameinfo, propGameMode, propTimeControl])


  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl || "no-url")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const handleCancel = () => {
    setShowMatchFound(false)
    onCancel()
  }

  const handleOverlayClick = () => {
    if (showMatchFound) {
      onCancel()
    }
  }

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const getGameModeIcon = () => {
    return Zap
  }

  const getTimeControlIcon = () => {
    if (!gameinfo) return TreePine
    switch (CategoriseTime(gameinfo.time_control)) {
      case "bullet":
        return Rocket
      case "blitz":
        return Rocket
      case "rapid":
        return TreePine
      default:
        return Rocket
    }
  }

  const getGameModeLabel = () => {
    return gameMode ? gameMode.charAt(0).toUpperCase() + gameMode.slice(1) : "Loading"
  }

  const getTimeControlLabel = () => {
    return timeControl ? timeControl.charAt(0).toUpperCase() + timeControl.slice(1) : "Loading"
  }

  const shouldShowFriendlyView = gameMode && gameMode.toLowerCase().includes("friendly")
  const shouldShowLoadingView = isLoadingGameData || !gameMode || !timeControl
  const shouldShowMatchmakingView = !shouldShowFriendlyView && !shouldShowLoadingView && !gameMode.toLowerCase().includes("ranked")

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999]">
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
          />

          <div className="fixed inset-0 flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              className="relative max-w-lg w-full pointer-events-auto"
              initial={{ scale: 0.9, opacity: 0, x: -100 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 100 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onClick={handleModalClick}
            >
              <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[600px]">
                <div className="relative h-full flex flex-col">
                  <div className="flex items-center p-8 pb-6 relative">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{
                        scale: 1,
                        rotate: showMatchFound ? 0 : [0, 10, -10, 5, -5, 0],
                      }}
                      transition={{
                        scale: { duration: 0.6, type: "spring", stiffness: 200 },
                        rotate: showMatchFound
                          ? { duration: 0.3 }
                          : {
                              duration: 2,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                              delay: 0.6,
                            },
                      }}
                      className="absolute left-8"
                    >
                      <Swords className="w-12 h-12 text-white" />
                    </motion.div>

                    <div className="w-full flex justify-center">
                      <motion.div
                        className="flex-grow text-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <AnimatePresence mode="wait">
                          {showMatchFound ? (
                            <motion.h1
                              key="match-found"
                              className="text-3xl lg:text-4xl font-bold text-white"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              transition={{ duration: 0.3 }}
                            >
                              Match Found!
                            </motion.h1>
                          ) : (
                            <motion.h1
                              key="waiting"
                              className="text-3xl lg:text-4xl font-bold text-white"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              transition={{ duration: 0.3 }}
                            >
                              Waiting For Match
                            </motion.h1>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col">
                    <AnimatePresence mode="wait">
                      {shouldShowLoadingView && (
                        <motion.div
                          key="loading-view"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="flex-grow flex flex-col px-8"
                        >
                          <motion.div
                            className="bg-slate-600/50 rounded-lg p-5 mb-8 flex items-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            >
                              <Clock className="w-8 h-8 text-white" />
                            </motion.div>
                            <span className="text-white text-2xl font-semibold">Loading...</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center justify-between mb-8 flex-grow"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                                <span className="text-white text-sm">Icon</span>
                              </div>
                              <div>
                                <p className="text-white text-2xl font-bold">MYSELF</p>
                              </div>
                            </div>
                            <div className="text-white text-4xl font-bold">1082</div>
                          </motion.div>

                          <motion.div
                            className="pb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                          >
                            <Button
                              onClick={handleCancel}
                              className="w-full h-14 text-xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                              Cancel
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}

                      {shouldShowMatchmakingView && (
                        <motion.div
                          key="matchmaking-view"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="flex-grow flex flex-col px-8"
                        >
                          <motion.div
                            className="bg-slate-600/50 rounded-lg p-5 mb-8 flex items-center justify-between"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                          >
                            <div className="flex items-center gap-3">
                              {(() => {
                                const GameModeIcon = getGameModeIcon()
                                return <GameModeIcon className="w-8 h-8 text-green-500" />
                              })()}
                              <span className="text-white text-2xl font-semibold">{getGameModeLabel()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {(() => {
                                const TimeControlIcon = getTimeControlIcon()
                                return <TimeControlIcon className="w-8 h-8 text-green-500" />
                              })()}
                              <span className="text-white text-2xl font-semibold">{getTimeControlLabel()}</span>
                            </div>
                          </motion.div>

                          <motion.div
                            key={`player-info-${forceUpdateTrigger}-${meRef.current?.username}`}
                            className="flex items-center justify-between mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            layout
                            transition={{ duration: 0.4, delay: 0.4, layout: { duration: 0.3 } }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                                <img
                                  className="w-full h-full object-cover"
                                  src={meRef.current?.pfp || "/icons/user.svg"}
                                  alt="Your profile"
                                />
                              </div>
                              <div>
                                <p className="text-white text-2xl font-bold">{meRef.current?.username || "You"}</p>
                              </div>
                            </div>
                            <div className="text-white text-4xl font-bold">{meRef.current?.elo || "?"}</div>
                          </motion.div>

                          <motion.div
                            className="bg-slate-600/30 rounded-lg p-6 mb-8 flex items-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            >
                              <Clock className="w-8 h-8 text-white" />
                            </motion.div>
                            <span className="text-white text-2xl font-semibold">Finding Match...</span>
                          </motion.div>

                          <motion.div
                            className="pb-8 mt-auto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                          >
                            <Button
                              onClick={handleCancel}
                              className="w-full h-14 text-xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                              Cancel
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}

                      {shouldShowFriendlyView && !showMatchFound && (
                        <motion.div
                          key="friendly-view"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="px-8 flex-grow flex flex-col"
                        >
                          <motion.div
                            className="bg-slate-600/50 rounded-lg p-5 mb-8 flex items-center justify-between"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                          >
                            <div className="flex items-center gap-3">
                              {(() => {
                                const GameModeIcon = getGameModeIcon()
                                return <GameModeIcon className="w-8 h-8 text-green-500" />
                              })()}
                              <span className="text-white text-2xl font-semibold">{getGameModeLabel()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {(() => {
                                const TimeControlIcon = getTimeControlIcon()
                                return <TimeControlIcon className="w-8 h-8 text-green-500" />
                              })()}
                              <span className="text-white text-2xl font-semibold">{getTimeControlLabel()}</span>
                            </div>
                          </motion.div>

                          <motion.div
                            className="flex items-center justify-between mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                                <img
                                  src={meRef.current?.pfp || "/icons/user.svg"}
                                  alt="Player Avatar"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-white text-2xl font-bold">{meRef.current?.username || "You"}</p>
                              </div>
                            </div>
                            <div className="text-white text-4xl font-bold">{meRef.current?.elo || "?"}</div>
                          </motion.div>

                          <motion.div
                            className="bg-slate-600/30 rounded-lg p-6 space-y-4 mb-8 flex-grow"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                          >
                            <p className="text-white text-lg">To invite someone to play, give this URL:</p>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-blue-600 rounded-lg px-4 py-3 text-white font-mono text-sm lg:text-base overflow-hidden">
                                <div className="truncate">{gameUrl}</div>
                              </div>
                              <Button
                                onClick={handleCopyUrl}
                                variant="ghost"
                                size="icon"
                                className="bg-slate-500 hover:bg-slate-400 text-white h-12 w-12 rounded-lg flex-shrink-0"
                              >
                                <AnimatePresence mode="wait">
                                  {copied ? (
                                    <motion.div
                                      key="check"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Check className="w-5 h-5" />
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      key="copy"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Copy className="w-5 h-5" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </Button>
                            </div>

                            <p className="text-slate-300 text-sm">The first person to use this link will play you.</p>
                          </motion.div>

                          <motion.div
                            className="px-2 pb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Button
                              onClick={handleCancel}
                              className="w-full h-14 text-xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                              Cancel
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}

                      {showMatchFound && (
                        <motion.div
                          key="match-found-content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="px-8 h-full flex flex-col justify-center"
                        >
                          {!shouldShowFriendlyView && (
                            <motion.div
                              className="bg-slate-600/50 rounded-lg p-5 mb-8 flex items-center justify-between"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.1 }}
                            >
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const GameModeIcon = getGameModeIcon()
                                  return <GameModeIcon className="w-8 h-8 text-green-500" />
                                })()}
                                <span className="text-white text-2xl font-semibold">{getGameModeLabel()}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const TimeControlIcon = getTimeControlIcon()
                                  return <TimeControlIcon className="w-8 h-8 text-green-500" />
                                })()}
                                <span className="text-white text-2xl font-semibold">{getTimeControlLabel()}</span>
                              </div>
                            </motion.div>
                          )}

                          <motion.div
                            key={`match-found-player-${forceUpdateTrigger}-${meRef.current?.username}`}
                            className="flex items-center justify-between mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            layout
                            transition={{ duration: 0.4, delay: 0.2, layout: { duration: 0.3 } }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                                <img
                                  src={meRef.current?.pfp || "/icons/user.svg"}
                                  alt="Player Avatar"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-white text-2xl font-bold">{meRef.current?.username || "You"}</p>
                              </div>
                            </div>
                            <div className="text-white text-4xl font-bold">{meRef.current?.elo || "?"}</div>
                          </motion.div>

                          <motion.div
                            className="flex justify-center py-4"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                          >
                            <span className="text-white text-6xl font-bold">VS</span>
                          </motion.div>

                          <motion.div
                            key={`opponent-info-${forceUpdateTrigger}-${opponentRef.current?.username}`}
                            className="flex items-center justify-between pb-8 mt-4"
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            layout
                            transition={{ duration: 0.5, delay: 0.4, layout: { duration: 0.3 } }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                                <img
                                  src={opponentRef.current?.pfp || "/icons/user.svg"}
                                  alt="Opponent Avatar"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-white text-2xl font-bold">
                                  {opponentRef.current?.username || "Opponent"}
                                </p>
                              </div>
                            </div>
                            <div className="text-white text-4xl font-bold">{opponentRef.current?.elo || "?"}</div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
