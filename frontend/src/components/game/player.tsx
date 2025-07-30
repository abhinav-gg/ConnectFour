"use client"

import type React from "react"
import { motion } from "framer-motion"
import { User2 } from "lucide-react" // Default icon

interface PlayerInfoProps {
  name: string
  icon?: React.ElementType
  playerColor: "red" | "yellow"
}

export function PlayerInfo({ name, icon: Icon = User2, playerColor }: PlayerInfoProps) {
  return (
    <motion.div
      className="flex items-center gap-2" // Always flex-row, icon always first
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={`w-6 h-6 rounded-sm bg-black flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-white font-semibold text-base">{name}</span>
    </motion.div>
  )
}
