"use client"

import { useState, useEffect, MutableRefObject } from "react"
import { Button } from "@/components/ui/button"
import { TreePine, Rocket, Copy, Check, Swords } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PlayerData } from "@shared/types/users"

interface GameStartModalProps {
  open: boolean
  gameMode: string
  timeControl: string
  gameUrl?: string
  onCancel: () => void
  meRef: MutableRefObject<PlayerData | undefined>
  opponentRef: MutableRefObject<PlayerData | undefined>
  forceUpdateTrigger?: number // Add this to trigger re-renders when refs change
}

export function GameStartModal({
  open,
  gameMode,
  timeControl,
  gameUrl = "https://con4.uk/game/live/AWLFIJ",
  onCancel,
  meRef,
  opponentRef,
  forceUpdateTrigger,
}: GameStartModalProps) {
  const [copied, setCopied] = useState(false)
  const [showMatchFound, setShowMatchFound] = useState(false)

  // Update the match found state based on opponent data
  // This will re-run whenever forceUpdateTrigger changes
  useEffect(() => {
    const hasOpponentData = open && opponentRef.current?.username && opponentRef.current?.elo
    setShowMatchFound(!!hasOpponentData)
  }, [open, forceUpdateTrigger])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl)
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
    // Only allow clicking outside to close during phase 2 (match found)
    if (showMatchFound) {
      setShowMatchFound(false)
      onCancel()
    }
  }

  const handleModalClick = (e: React.MouseEvent) => {
    // Prevent clicks inside the modal from closing it
    e.stopPropagation()
  }

  const getGameModeIcon = () => {
    switch (gameMode) {
      case "casual":
        return TreePine
      case "ranked":
        return TreePine // Using same icon for now
      default:
        return TreePine
    }
  }

  const getTimeControlIcon = () => {
    switch (timeControl) {
      case "bullet":
        return Rocket
      case "blitz":
        return Rocket // Using same icon for now
      case "rapid":
        return TreePine
      default:
        return Rocket
    }
  }

  const getGameModeLabel = () => {
    return gameMode.charAt(0).toUpperCase() + gameMode.slice(1)
  }

  const getTimeControlLabel = () => {
    return timeControl.charAt(0).toUpperCase() + timeControl.slice(1)
  }

  // Replace the Dialog with a fixed positioning approach similar to game-end-popup
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999]">
          {/* Custom overlay with immediate appearance */}
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
          />
          
          {/* Modal content */}
          <div className="fixed inset-0 flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              className="relative max-w-lg w-full pointer-events-auto"
              initial={{ scale: 0.9, opacity: 0, x: -100 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 100 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30
              }}
              onClick={handleModalClick}
            >
              {/* Fixed height container to prevent resizing */}
              <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[600px]">
                <div className="relative h-full flex flex-col">
                  {/* Header with Logo and Title - Left aligned icon with centered text */}
                  <div className="flex items-center p-8 pb-6 relative">
                    {/* Swords Icon - Fixed position with conditional animation */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ 
                        scale: 1, 
                        rotate: showMatchFound ? 0 : [0, 10, -10, 5, -5, 0] // Loop only during phase 1
                      }}
                      transition={{ 
                        scale: { duration: 0.6, type: "spring", stiffness: 200 },
                        rotate: showMatchFound 
                          ? { duration: 0.3 } // Quick settle for phase 2
                          : { 
                              duration: 2, 
                              repeat: Infinity, 
                              ease: "easeInOut",
                              delay: 0.6 // Start after initial animation
                            }
                      }}
                      className="absolute left-8"
                    >
                      <Swords className="w-12 h-12 text-white" />
                    </motion.div>

                    {/* Title - Container is centered in available space */}
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

                  {/* Main content area with flex-grow to fill available space */}
                  <div className="flex-grow flex flex-col">
                    {/* Game Mode Info */}
                    <motion.div
                      className="mx-8 mb-8 bg-slate-600/50 rounded-lg p-5 flex items-center justify-between"
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

                    {/* Players Section - Take remaining space */}
                    <div className="px-8 flex-grow flex flex-col">
                      {/* Player always visible */}
                      <motion.div
                        className="flex items-center justify-between mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        layout
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
                        <div className="text-white text-4xl font-bold">{meRef.current?.elo || 1200}</div>
                      </motion.div>

                      {/* Conditional Content - Fills the remaining space */}
                      <div className="flex-grow">
                        <AnimatePresence mode="wait" initial={false}>
                          {showMatchFound && opponentRef.current?.username && opponentRef.current?.elo ? (
                            // Match Found State
                            <motion.div
                              key="match-found-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.5 }}
                              className="h-full flex flex-col justify-center"
                            >
                              {/* VS - Centered between players */}
                              <motion.div
                                className="flex justify-center py-4"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                              >
                                <span className="text-white text-6xl font-bold">VS</span>
                              </motion.div>

                              {/* Opponent */}
                              <motion.div
                                className="flex items-center justify-between pb-8 mt-4"
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
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
                                    <p className="text-white text-2xl font-bold">{opponentRef.current?.username}</p>
                                  </div>
                                </div>
                                <div className="text-white text-4xl font-bold">{opponentRef.current?.elo}</div>
                              </motion.div>
                            </motion.div>
                          ) : (
                            // Waiting State - Show invitation
                            <motion.div
                              key="waiting-invitation"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="h-full flex flex-col"
                            >
                              {/* Invite Section */}
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

                              {/* Cancel Button - At the bottom */}
                              <motion.div
                                className="px-2 pb-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    onClick={handleCancel}
                                    className="w-full h-14 text-xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                  >
                                    Cancel
                                  </Button>
                                </motion.div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
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
