"use client"

import { motion } from "framer-motion"
import { useRef } from "react"

interface Move {
  column: number
  player: "red" | "yellow"
  moveNumber: number
}

interface MoveHistoryProps {
  moves?: Move[]
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Default moves for demonstration
  const defaultMoves: Move[] = [
    { column: 4, player: "red", moveNumber: 1 },
    { column: 4, player: "yellow", moveNumber: 2 },
    { column: 4, player: "red", moveNumber: 3 },
    { column: 4, player: "yellow", moveNumber: 4 },
    { column: 4, player: "red", moveNumber: 5 },
    { column: 4, player: "yellow", moveNumber: 6 },
    { column: 4, player: "red", moveNumber: 7 },
    { column: 4, player: "yellow", moveNumber: 8 },
    { column: 4, player: "red", moveNumber: 9 },
    { column: 4, player: "yellow", moveNumber: 10 },
    { column: 4, player: "red", moveNumber: 11 },
    { column: 4, player: "yellow", moveNumber: 12 },
    { column: 4, player: "red", moveNumber: 13 },
    { column: 4, player: "yellow", moveNumber: 14 },
    { column: 4, player: "red", moveNumber: 15 },
    { column: 4, player: "yellow", moveNumber: 16 },
  ]

  const moveData = moves || defaultMoves

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-white text-lg font-bold text-center mb-2 flex-shrink-0">Move History</h3>
      <div ref={scrollRef} className="bg-brand-primary/40 rounded-lg p-3 overflow-y-auto scrollbar-custom flex-1">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-x-3 gap-y-3">
          {moveData.map((move, index) => (
            <motion.div
              key={`${move.moveNumber}-${index}`}
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
            >
              <span className="text-white text-base font-medium flex-shrink-0 select-none">{move.moveNumber}.</span>
              <motion.div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
                  text-white font-bold text-lg
                  ${move.player === "red" ? "bg-brand-accent-red" : "bg-brand-accent-yellow"}
                `}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                whileHover={{ scale: 1.1 }}
              >
                {move.column}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
