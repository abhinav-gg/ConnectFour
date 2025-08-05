"use client"

import { Button } from "@/components/ui/button"
import { Trophy, HelpCircle, AlertCircle, X, ArrowUp, ArrowDown, Minus, Award } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState, MutableRefObject } from "react"
import { GameState, RedWinStates, YellowWinStates, DrawStates } from "@shared/constants/allgamestates"
import { EloChange } from "@shared/types/game"

interface GameEndModalProps {
  isOpen: boolean
  onClose: () => void
  state: GameState
  meRef: MutableRefObject<any>
  isRedRef: MutableRefObject<boolean>
  eloChangesRef: MutableRefObject<EloChange | null>
  mistakes: number
  blunders: number
  greatMoves: number
  onReviewGame: () => void
  onNewGame: () => void
  onRematch: () => void
}

export function GameEndModal({
  isOpen,
  onClose,
  state,
  meRef,
  isRedRef,
  eloChangesRef,
  mistakes,
  blunders,
  greatMoves,
  onReviewGame,
  onNewGame,
  onRematch,
}: GameEndModalProps) {
  const [animatedRating, setAnimatedRating] = useState(0)
  const [displayRating, setDisplayRating] = useState(0)
  const [showRatingChange, setShowRatingChange] = useState(false)

  const playerName = meRef.current?.username || "Player"
  const isRed = isRedRef.current
  
  // Determine game outcome once at the top
  const isWin = (RedWinStates.has(state) && isRed) || (YellowWinStates.has(state) && !isRed)
  const isLoss = (RedWinStates.has(state) && !isRed) || (YellowWinStates.has(state) && isRed)
  const isDraw = DrawStates.has(state)
  
  // Get actual player rating and changes from refs
  const currentRating = meRef.current?.elo
  const eloChanges = eloChangesRef.current
  
  // Determine the actual rating change based on game outcome
  const actualRatingChange = eloChanges ? 
    (isWin ? eloChanges.win : isLoss ? eloChanges.loss : eloChanges.draw) : 
    0;
  
  // Check if elo data is available for display
  const showEloSection = currentRating != null && eloChanges != null

  // Animate number counter
  const animateNumber = (from: number, to: number, duration: number = 1000) => {
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOutCubic(progress)
      
      const currentValue = from + (to - from) * easedProgress
      setDisplayRating(Math.round(currentValue))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }

  useEffect(() => {
    if (isOpen && showEloSection) {
      const originalRating = currentRating - actualRatingChange
      // Reset animation state when popup opens
      setAnimatedRating(originalRating)
      setDisplayRating(originalRating)
      setShowRatingChange(true) // Show rating change immediately
      
      // Start animation after a short delay
      const timer = setTimeout(() => {
        animateNumber(originalRating, currentRating, 1200)
        setAnimatedRating(currentRating)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (isOpen) {
      // Reset states when elo data is not available
      setShowRatingChange(false)
      setDisplayRating(0)
      setAnimatedRating(0)
    }
  }, [isOpen, currentRating, actualRatingChange, showEloSection])
  const getResultText = () => {
    if (isDraw) {
      return "Draw"
    }
    
    if (isWin) {
      return "You Won"
    }
    
    if (isLoss) {
      return "You Lost"
    }
    
    return "Game Over" // Fallback
  }

  const getReasonText = () => {
    switch (state) {
      case GameState.RED_WIN:
      case GameState.YELLOW_WIN:
        return "By Victory"
      case GameState.RED_TIMEOUT:
      case GameState.YELLOW_TIMEOUT:
        return "By Timeout"
      case GameState.RED_RESIGNED:
      case GameState.YELLOW_RESIGNED:
        return "By Resignation"
      case GameState.RED_DISCONNECTED:
      case GameState.YELLOW_DISCONNECTED:
        return "By Disconnection"
      case GameState.DRAW_FULL:
        return "Board Full"
      case GameState.AGREED_DRAW:
        return "By Agreement"
      default:
        return ""
    }
  }

  const getTrophyIcon = () => {
    if (isDraw) {
      return Award
    }
    
    if (isWin) {
      return Trophy
    }
    
    if (isLoss) {
      return X
    }
    
    return Trophy // Fallback
  }

  const getTrophyColor = () => {
    if (isDraw) {
      return "text-blue-400"
    }
    
    if (isWin) {
      return "text-yellow-400"
    }
    
    if (isLoss) {
      return "text-red-400"
    }
    
    return "text-gray-400" // Fallback
  }

  const getRatingChangeDisplay = (change: number) => {
    if (isWin) {
      // Win: Always green up arrow (even if change is 0 or negative due to some edge case)
      return {
        icon: ArrowUp,
        color: "text-green-400",
        bgColor: "from-green-400 to-green-600",
        text: change > 0 ? `+${change}` : change < 0 ? `${change}` : "0"
      }
    } else if (isLoss) {
      // Loss: Always red down arrow
      return {
        icon: ArrowDown,
        color: "text-red-400",
        bgColor: "from-red-400 to-red-600",
        text: change > 0 ? `+${change}` : change < 0 ? `${change}` : "0"
      }
    } else if (isDraw) {
      // Draw: Always grey up arrow (even if there's a change)
      return {
        icon: change < 0 ? ArrowDown : ArrowUp,
        color: "text-gray-400",
        bgColor: "from-gray-400 to-gray-600",
        text: change > 0 ? `+${change}` : change < 0 ? `${change}` : "0"
      }
    } else {
      // Fallback: base on actual change value
      if (change > 0) {
        return {
          icon: ArrowUp,
          color: "text-green-400",
          bgColor: "from-green-400 to-green-600",
          text: `+${change}`
        }
      } else if (change < 0) {
        return {
          icon: ArrowDown,
          color: "text-red-400",
          bgColor: "from-red-400 to-red-600",
          text: `${change}`
        }
      } else {
        return {
          icon: ArrowUp,
          color: "text-gray-400",
          bgColor: "from-gray-400 to-gray-600",
          text: "0"
        }
      }
    }
  }

  return (
    <div className={`${isOpen ? 'fixed inset-0 z-[9999]' : 'hidden'}`}>
      {/* Custom overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          className="relative max-w-md w-full pointer-events-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: isOpen ? 1 : 0.9, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on modal content
        >
          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl p-6 text-white">
          {/* Header with Trophy and Result */}
          <motion.div 
            className="flex items-center gap-4 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
            >
              {(() => {
                const TrophyIcon = getTrophyIcon()
                return <TrophyIcon className={`w-16 h-16 ${getTrophyColor()}`} />
              })()}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h1 className="text-3xl font-bold text-white">{getResultText()}</h1>
              <p className="text-teal-400 text-lg">{getReasonText()}</p>
            </motion.div>
          </motion.div>

          {/* Player Rating Section */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center gap-4">
              {/* Player Avatar Placeholder */}
              <motion.div 
                className="w-16 h-16 bg-black rounded-lg flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.9, type: "spring" }}
              >
                <span className="text-white text-xs">Icon</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <p className="text-gray-300 text-sm uppercase tracking-wide">{playerName}</p>
                <motion.p 
                  className={`text-white text-3xl font-bold ${!showEloSection ? 'invisible' : ''}`}
                  animate={{ 
                    scale: showRatingChange ? [1, 1.1, 1] : 1,
                    color: showRatingChange && actualRatingChange > 0 ? "#4ade80" : 
                           showRatingChange && actualRatingChange < 0 ? "#f87171" : "#ffffff"
                  }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  {displayRating}
                </motion.p>
              </motion.div>
            </div>

            {/* Rating Change - Only show for the player */}
            {showRatingChange && showEloSection && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1.1 }}
              >
                {(() => {
                  const changeInfo = getRatingChangeDisplay(actualRatingChange)
                  const IconComponent = changeInfo.icon
                  
                  return (
                    <>
                      <div className={`w-8 h-8 bg-gradient-to-br ${changeInfo.bgColor} rounded flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <span className={`${changeInfo.color} text-2xl font-bold`}>
                        {changeInfo.text}
                      </span>
                    </>
                  )
                })()}
              </motion.div>
            )}
          </motion.div>

          {/* Game Statistics */}
          <motion.div 
            className="flex justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.8 }}
          >
            <motion.div 
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 3.0, type: "spring" }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-orange-400 text-3xl font-bold ml-2">{mistakes}</span>
              </div>
              <p className="text-orange-400 text-lg font-semibold">Mistakes</p>
            </motion.div>

            <motion.div 
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 3.2, type: "spring" }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-red-400 text-3xl font-bold ml-2">{blunders}</span>
              </div>
              <p className="text-red-400 text-lg font-semibold">Blunders</p>
            </motion.div>

            <motion.div 
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 3.4, type: "spring" }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-400 text-3xl font-bold ml-2">{greatMoves}</span>
              </div>
              <p className="text-blue-400 text-lg font-semibold">Great</p>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 3.6 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 3.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onReviewGame}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl py-4 rounded-xl font-semibold"
              >
                Review Game
              </Button>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 4.0 }}
            >
              <motion.div
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3, delay: 4.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={onNewGame}
                  variant="secondary"
                  className="bg-gray-600 hover:bg-gray-700 text-white text-lg py-3 rounded-xl font-semibold w-full"
                >
                  New Game
                </Button>
              </motion.div>
              <motion.div
                initial={{ x: 20 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3, delay: 4.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={onRematch}
                  variant="secondary"
                  className="bg-gray-600 hover:bg-gray-700 text-white text-lg py-3 rounded-xl font-semibold w-full"
                >
                  Rematch
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
