"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Layout } from "./mainlayout"
import Board, { BoardHandle } from "../boards/Board"

interface BoardSpaceLayoutProps {
  children: React.ReactNode,
  boardRef?: React.RefObject<BoardHandle> // Optional ref for the board
  boardProps?: {
    interactive?: boolean
    onColumnAttempt?: (col: number) => void
    boardState?: (number | null)[][]
    gameOver?: boolean
    animate_init?: boolean
    ariaLabel?: string
  }
  space2?: React.ReactNode
  showBoard?: boolean
  boardColumnRatio?: "50%" | "66%" // New prop to control board width
}

export function BoardSpaceLayout({
  children,
  boardRef,
  boardProps = {},
  space2,
  showBoard = true,
  boardColumnRatio = "66%", // Default to 66% (2fr_1fr)
}: BoardSpaceLayoutProps) {
  const defaultBoardProps = {
    ref: boardRef,
    interactive: false,
    animate_init: false,
    ariaLabel: "Connect 4 game board",
    ...boardProps,
  }

  // Determine the grid column class based on the prop
  const gridColsClass = boardColumnRatio === "50%" ? "lg:grid-cols-2" : "lg:grid-cols-[2fr_1fr]"

  return (
    <Layout>
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-7xl mx-auto">
          {/* Desktop Layout - Side by side */}
          <div className={`hidden lg:grid ${gridColsClass} gap-8 xl:gap-16 items-start`}>
            {/* Left side - Connect 4 Board */}
            {showBoard && (
              <div className="flex justify-center items-center w-full h-full">
                <Board {...defaultBoardProps} />
              </div>
            )}

            {/* Right side - Main Content Box */}
            <div className={`w-full ${!showBoard ? "lg:col-span-2" : ""}`}>
              <motion.div
                className="bg-brand-secondary rounded-3xl p-8 lg:p-10 shadow-2xl border border-brand-border/40 select-none flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {children} {/* Main content goes here */}
              </motion.div>
            </div>
          </div>

          {/* Mobile/Tablet Layout - Stacked */}
          <div className="lg:hidden space-y-6">
            {/* Connect 4 Board - Top on mobile */}
            {showBoard && (
              <div className="flex justify-center">
                <Board {...defaultBoardProps} className="max-w-sm" />
              </div>
            )}

            {/* Main Content Box */}
            <div className="w-full max-w-lg mx-auto">
              <motion.div
                className="bg-brand-secondary rounded-3xl p-6 lg:p-8 shadow-2xl border border-brand-border/40 select-none flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {children} {/* Main content goes here */}
              </motion.div>
            </div>

            {/* Space 2 - Mobile */}
            {space2 && (
              <motion.div
                className="w-full max-w-lg mx-auto mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              >
                {space2}
              </motion.div>
            )}
          </div>

          {/* Space 2 - Desktop only, full width below */}
          {space2 && (
            <motion.div
              className="hidden lg:block mt-8 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            >
              {space2}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  )
}
