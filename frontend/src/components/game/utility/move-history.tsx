"use client"

import { motion } from "framer-motion"
import { useRef, useEffect, useState } from "react"

interface Move {
  column: number
  player: "red" | "yellow"
  moveNumber: number
}

interface MoveHistoryProps {
  moves?: Move[]
  onMoveClick?: (moveIndex: number) => void
}

export function MoveHistory({ moves, onMoveClick }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Monitor container width for responsive sizing
  useEffect(() => {
    const updateWidth = () => {
      if (scrollRef.current) {
        setContainerWidth(scrollRef.current.clientWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Calculate optimal grid columns and sizes based on container width
  const getResponsiveSettings = () => {
    if (containerWidth < 150) {
      return { cols: 2, circleSize: 'w-6 h-6', fontSize: 'text-xs', gap: 'gap-0.5', padding: 'p-1' }
    } else if (containerWidth < 200) {
      return { cols: 2, circleSize: 'w-7 h-7', fontSize: 'text-xs', gap: 'gap-1', padding: 'p-1' }
    } else if (containerWidth < 300) {
      return { cols: 3, circleSize: 'w-8 h-8', fontSize: 'text-xs', gap: 'gap-1', padding: 'p-2' }
    } else if (containerWidth < 400) {
      return { cols: 4, circleSize: 'w-9 h-9', fontSize: 'text-sm', gap: 'gap-1.5', padding: 'p-2' }
    } else if (containerWidth < 500) {
      return { cols: 5, circleSize: 'w-10 h-10', fontSize: 'text-sm', gap: 'gap-2', padding: 'p-2' }
    } else if (containerWidth < 600) {
      return { cols: 6, circleSize: 'w-11 h-11', fontSize: 'text-base', gap: 'gap-2', padding: 'p-3' }
    } else {
      return { cols: 7, circleSize: 'w-12 h-12', fontSize: 'text-base', gap: 'gap-2.5', padding: 'p-3' }
    }
  }

  const settings = getResponsiveSettings()

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
      <h3 className="text-white text-sm sm:text-base lg:text-lg font-bold text-center mb-1 sm:mb-2 flex-shrink-0">
        Move History
      </h3>
      <div 
        ref={scrollRef} 
        className={`bg-brand-primary/40 rounded-lg ${settings.padding} overflow-y-auto overflow-x-hidden scrollbar-custom flex-1`}
      >
        <div 
          className={`grid ${settings.gap} gap-y-1.5 sm:gap-y-2 w-full`}
          style={{ 
            gridTemplateColumns: `repeat(${settings.cols}, minmax(0, 1fr))`,
          }}
        >
          {moveData.map((move, index) => (
            <motion.div
              key={`${move.moveNumber}-${index}`}
              className="flex items-center justify-start gap-0.5 sm:gap-1 min-w-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
            >
              <span className={`text-white ${settings.fontSize} font-medium flex-shrink-0 select-none min-w-0 leading-none text-right`}
                style={{ minWidth: '1.5em' }}
              >
                {move.moveNumber}.
              </span>
              <motion.div
                className={`
                  ${settings.circleSize} rounded-full flex items-center justify-center flex-shrink-0
                  text-white font-bold ${settings.fontSize} cursor-pointer
                  min-w-0 transition-colors duration-200 leading-none
                  ${move.player === "red" 
                    ? "bg-brand-accent-red hover:bg-red-600 active:bg-red-700" 
                    : "bg-brand-accent-yellow hover:bg-yellow-600 active:bg-yellow-700"
                  }
                `}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMoveClick?.(index)}
                title={`Move ${move.moveNumber}: Column ${move.column} (${move.player})`}
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
