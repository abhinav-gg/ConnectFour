"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ThumbsUp, ThumbsDown, HelpCircle, ChevronRight, ArrowUp, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Toggle } from "@/components/ui/toggle" // Import the new Toggle component

interface PuzzleUIProps {
  score?: number
  playedTimes?: number
  onScoreChange?: (change: number, type: "positive" | "negative") => void
  onVote?: (vote: "up" | "down") => void
  onHint?: () => void
  onSolution?: () => void
  currentPlayer?: "red" | "yellow"
  showVoting?: boolean
  scoreChange?: { change: number, type: "positive" | "negative" } | null
}

export function PuzzleUI({
  score = 1082,
  playedTimes = 0,
  onScoreChange,
  onVote,
  onHint,
  onSolution,
  currentPlayer = "yellow",
  showVoting = true,
  scoreChange = null,
}: PuzzleUIProps) {
  const router = useRouter()
  const [jumpToNext, setJumpToNext] = useState(false)
  const [scoreChanges, setScoreChanges] = useState<
    Array<{
      id: string
      change: number
      type: "positive" | "negative"
    }>
  >([])

  const animatedScore = useMotionValue(score)
  const roundedScore = useTransform(animatedScore, Math.round)

  useEffect(() => {
    animatedScore.set(score)
  }, [score, animatedScore])

  // If scoreChange is provided, override the scoreChanges state
  useEffect(() => {
    if (scoreChange) {
      const newChange = {
        id: `external-${Date.now()}-${Math.random()}`,
        change: scoreChange.change,
        type: scoreChange.type,
      }
      setScoreChanges([newChange])
      const timeout = setTimeout(() => setScoreChanges([]), 2000)
      return () => clearTimeout(timeout)
    }
  }, [scoreChange])

  const handleScoreChange = (change: number, type: "positive" | "negative") => {
    if (scoreChange) return; // ignore if external scoreChange is present
    const newChange = {
      id: `${Date.now()}-${Math.random()}`,
      change,
      type,
    }
    setScoreChanges((prev) => [...prev, newChange])

    // Remove the score change after animation
    setTimeout(() => {
      setScoreChanges((prev) => prev.filter((item) => item.id !== newChange.id))
    }, 2000)

    onScoreChange?.(change, type)
  }

  const handleVote = (vote: "up" | "down") => {
    onVote?.(vote)
    // Simulate score change based on vote
    if (vote === "up") {
      handleScoreChange(Math.floor(Math.random() * 50) + 10, "positive")
    } else {
      handleScoreChange(-(Math.floor(Math.random() * 20) + 5), "negative")
    }
  }

  return (
    <motion.div
      className="space-y-4 lg:space-y-3 text-white h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 lg:mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-brand-accent-green hover:bg-brand-accent-green/20 p-2"
        >
          <ArrowLeft className="h-5 w-5 lg:h-6 lg:w-6" />
        </Button>
        <h1 className="text-4xl lg:text-3xl xl:text-4xl font-bold">Puzzles</h1>
      </div>

      {/* Stats Card */}
      <motion.div
        className="bg-brand-primary/50 rounded-2xl p-4 lg:p-4 space-y-4 lg:space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-brand-text-muted text-lg lg:text-base">
          Played {playedTimes > 0 ? playedTimes : "XXX"} times
        </p>

        {/* Score Display with Changes */}
        <div className="flex items-center justify-center gap-4 lg:gap-6 relative">
          <div className="bg-brand-primary/80 rounded-2xl px-6 lg:px-8 py-3 lg:py-4">
            <motion.span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white">{roundedScore}</motion.span>
          </div>

          {/* Animated Score Changes with Arrows */}
          <div className="relative w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center">
            <AnimatePresence>
              {scoreChanges.length > 0 && (
                <motion.div
                  key={scoreChanges[0].id} // Only animate the first (most recent) change
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute flex flex-col items-center"
                >
                  {scoreChanges[0].type === "positive" ? (
                    <ArrowUp className="h-6 w-6 lg:h-8 lg:w-8 text-brand-accent-green" />
                  ) : (
                    <ArrowDown className="h-6 w-6 lg:h-8 lg:w-8 text-brand-accent-red" />
                  )}
                  <motion.span
                    className={`text-lg lg:text-xl font-bold ${
                      scoreChanges[0].type === "positive" ? "text-brand-accent-green" : "text-brand-accent-red"
                    }`}
                    initial={{ opacity: 0, y: scoreChanges[0].type === "positive" ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: scoreChanges[0].type === "positive" ? -10 : 10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {scoreChanges[0].type === "positive" ? "+" : ""}
                    {scoreChanges[0].change}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Jump to Next Toggle */}
        <motion.div
          className="flex items-center gap-3 lg:gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Toggle checked={jumpToNext} onCheckedChange={setJumpToNext} />
          <span className="text-base lg:text-lg">Jump to next puzzle immediately</span>
        </motion.div>
      </motion.div>

      {/* Message Card */}
      {showVoting && (
        <motion.div
          className="bg-brand-primary/50 rounded-2xl p-4 lg:p-4 text-center space-y-4 lg:space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold">MESSAGE!</h2>
          <p className="text-brand-text-light text-base lg:text-lg">Did you like this puzzle? Vote to load the next.</p>

          <div className="flex justify-center gap-6 lg:gap-8">
            <Button
              onClick={() => handleVote("up")}
              variant="ghost"
              size="lg"
              className="text-brand-accent-green hover:bg-brand-accent-green/20 p-3 lg:p-4"
            >
              <ThumbsUp className="h-8 w-8 lg:h-12 lg:w-12 stroke-[3]" />
            </Button>
            <Button
              onClick={() => handleVote("down")}
              variant="ghost"
              size="lg"
              className="text-brand-accent-red hover:bg-brand-accent-red/20 p-3 lg:p-4"
            >
              <ThumbsDown className="h-8 w-8 lg:h-12 lg:w-12 stroke-[3]" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Your Turn Section */}
      <div className="space-y-4 lg:space-y-3">
        <div className="flex items-center gap-3 lg:gap-4">
          <div
            className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full ${
              currentPlayer === "yellow" ? "bg-brand-accent-yellow" : "bg-brand-accent-red"
            }`}
          />
          <div>
            <h3 className="text-xl lg:text-2xl font-bold">Your turn</h3>
            <p className="text-brand-text-light text-base lg:text-lg">Find the best move for {currentPlayer}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 lg:gap-4">
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onHint}
              variant="secondary"
              size="lg"
              className="w-full h-12 lg:h-14 text-base lg:text-lg bg-brand-primary/80 hover:bg-brand-primary transition-all duration-200"
            >
              <HelpCircle className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
              hint
            </Button>
          </motion.div>
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onSolution}
              variant="secondary"
              size="lg"
              className="w-full h-12 lg:h-14 text-base lg:text-lg bg-brand-primary/80 hover:bg-brand-primary transition-all duration-200"
            >
              <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
              solution
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
