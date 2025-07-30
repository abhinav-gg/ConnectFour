"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/utils/cn"


interface PlayerInfoProps {
  name: string
  icon?: React.ElementType
  playerColor?: "red" | "yellow"
  className?: string
  profilePicUrl?: string // New: profile picture URL
}

export function PlayerInfo({ name, icon: Icon, playerColor = "yellow", className, profilePicUrl }: PlayerInfoProps) {
  const colorClass = playerColor === "yellow" ? "text-brand-accent-yellow" : "text-brand-accent-red"
  const defaultPic = "/icons/user.svg"

  return (
    <motion.div
      className={cn("flex items-center gap-3", className)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Profile picture or icon */}
      {(
        <img
          src={profilePicUrl || defaultPic}
          alt={name + " profile"}
          className="w-7 h-7 rounded-sm object-cover bg-brand-border border border-brand-border"
        />
      )}
      <span className={cn("font-semibold text-lg", colorClass)}>{name}</span>
    </motion.div>
  )
}
