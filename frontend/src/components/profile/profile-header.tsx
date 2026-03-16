"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ProfileHeaderProps {
  username: string
  avatarUrl?: string
  moreComingSoonTooltip?: string
}

export function ProfileHeader({ username, avatarUrl, moreComingSoonTooltip }: ProfileHeaderProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Avatar */}
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-300 flex-shrink-0 overflow-hidden border border-brand-border/40">
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-300" />
        )}
      </div>

      {/* Username */}
      <h1 className="text-2xl md:text-3xl font-semibold text-white flex-1">{username}</h1>

      {/* More Coming Soon button with tooltip */}
      <div className="relative">
        <motion.button
          className="bg-[#5a8a3a] hover:bg-[#4e7a30] text-white font-semibold text-base md:text-lg px-6 py-3 rounded-xl transition-colors duration-200 cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          More Coming Soon
        </motion.button>

        <AnimatePresence>
          {showTooltip && moreComingSoonTooltip && (
            <motion.div
              className="absolute right-0 top-full mt-2 z-50 w-72 bg-gray-900/95 border border-brand-border/50 text-white text-sm rounded-xl px-4 py-3 shadow-2xl pointer-events-none"
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.18 }}
            >
              <div className="absolute -top-1.5 right-6 w-3 h-3 bg-gray-900/95 border-l border-t border-brand-border/50 rotate-45" />
              {moreComingSoonTooltip}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
