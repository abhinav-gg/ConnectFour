// src/components/providers/GameSessionProvider.tsx
"use client"

import { createContext, useContext, useRef, useEffect, type ReactNode, useCallback, useState } from "react"
import { useSocketContext } from "./SocketProvider"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Swords } from "lucide-react"

interface GameSessionContextType {
  joinGame: (shortcode: string) => void
  leaveGame: () => void
  isInGame: boolean
  currentShortcode: string | null
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined)

interface GameSessionProviderProps {
  children: ReactNode
}

// Return to Game Popup Component
function ReturnToGamePopup({
  shortcode,
  onReturn,
  onDismiss,
}: {
  shortcode: string
  onReturn: () => void
  onDismiss: () => void
}) {
  return (
    <motion.div
      className="fixed bottom-4 right-4 z-[99999] cursor-pointer select-none w-80 max-w-[calc(100vw-2rem)]" // Fixed width with viewport constraint
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }} // Removed scaling to prevent overflow
      exit={{ opacity: 0, y: 100, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.4,
      }}
      onClick={onReturn}
      whileHover={{ scale: 1.02 }} // Subtle hover effect
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl px-8 py-6 shadow-2xl border border-red-400/30 backdrop-blur-sm relative">
        <div className="flex items-center gap-6">
          {/* Animated Sword Icon */}
          <motion.div 
            className="flex-shrink-0"
            animate={{ 
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Swords className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Animated Text Content */}
          <motion.div 
            className="flex flex-col min-w-0 flex-1" // Added flex-1 and min-w-0 for proper text wrapping
            animate={{ 
              opacity: [1, 0.8, 1],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <div className="text-xl font-bold leading-tight mb-1">Active Game!</div>
            <div className="text-base opacity-90 leading-tight break-all">Room: {shortcode}</div>
            <div className="text-sm opacity-75 mt-1">Click to return to game</div>
          </motion.div>
        </div>

        {/* Always show dismiss button - no timer */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }} // Small delay for entrance
          className="absolute -top-3 -right-3 w-8 h-8 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg text-lg font-bold"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          title="Dismiss notification"
        >
          ×
        </motion.button>
      </div>
    </motion.div>
  )
}

export function GameSessionProvider({ children }: GameSessionProviderProps) {
  const { sendJson, connected, unsubscribePrefixedMessage } = useSocketContext()
  const router = useRouter()
  const pathname = usePathname()

  const currentShortcodeRef = useRef<string | null>(null)
  const isInGameRef = useRef(false)
  const hasLeftRef = useRef(false)
  const prevPathnameRef = useRef(pathname)

  // State for the return popup
  const [showReturnPopup, setShowReturnPopup] = useState(false)
  const [returnGameShortcode, setReturnGameShortcode] = useState<string | null>(null)

  // Force re-render when needed
  const [, forceUpdate] = useState({})

  // Guaranteed cleanup function that runs on ANY navigation
  const leaveGame = useCallback(() => {
    if (currentShortcodeRef.current && !hasLeftRef.current && connected) {
      console.log("🔌 GAME SESSION: Leaving game:", currentShortcodeRef.current)
      sendJson("matchmaking:leave", { shortcode: currentShortcodeRef.current })
      unsubscribePrefixedMessage("matchmaking")
      unsubscribePrefixedMessage("game")
      hasLeftRef.current = true
    }
    currentShortcodeRef.current = null
    isInGameRef.current = false
    forceUpdate({}) // Trigger re-render
  }, [sendJson, connected, unsubscribePrefixedMessage])

  const joinGame = useCallback(
    (shortcode: string) => {
      // Leave any existing game first
      leaveGame()

      currentShortcodeRef.current = shortcode
      isInGameRef.current = true
      hasLeftRef.current = false

      // Hide return popup if showing
      setShowReturnPopup(false)
      setReturnGameShortcode(null)

      console.log("🔌 GAME SESSION: Joining game:", shortcode)
      sendJson("matchmaking:join", { shortcode })
      forceUpdate({}) // Trigger re-render
    },
    [sendJson, leaveGame],
  )

  // Enhanced leaveGame to properly handle popup state
  const leaveGameEntirely = useCallback(() => {
    console.log("🔌 GAME SESSION: Leaving game entirely")
    leaveGame()
    setShowReturnPopup(false)
    setReturnGameShortcode(null)
  }, [leaveGame])

  // Handle returning to game from popup
  const handleReturnToGame = useCallback(() => {
    if (returnGameShortcode) {
      router.push(`/game/live?r=${returnGameShortcode}`) // Fixed URL structure
      setShowReturnPopup(false)
    }
  }, [returnGameShortcode, router])

  // Handle dismissing the popup (also leaves the game entirely)
  const handleDismissPopup = useCallback(() => {
    console.log("🔌 GAME SESSION: User dismissed return popup - leaving game entirely")
    setShowReturnPopup(false)
    setReturnGameShortcode(null)
    leaveGame() // Actually leave the game when dismissed
  }, [leaveGame])

  // Multiple cleanup strategies for maximum reliability
  useEffect(() => {
    // Strategy 1: Browser events (only on actual page unload)
    const handleBeforeUnload = () => {
      leaveGame()
    }

    // Strategy 2: Page hide (only for actual page navigation/close)
    const handlePageHide = () => {
      leaveGame()
    }

    // Note: Removed visibility change handler to prevent disconnect on tab switch/minimize
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("pagehide", handlePageHide)
      leaveGame() // Final cleanup
    }
  }, [leaveGame])

  // Strategy 4: Route change detection (Next.js App Router)
  useEffect(() => {
    // Detect route changes by comparing pathname
    if (prevPathnameRef.current !== pathname) {
      console.log("🔌 GAME SESSION: Route change detected:", prevPathnameRef.current, "->", pathname)

      // If we're leaving a game route and have an active game, show return popup
      if (prevPathnameRef.current?.includes("/game/live") && !pathname.includes("/game/live")) {
        if (currentShortcodeRef.current && isInGameRef.current) {
          console.log("🔌 GAME SESSION: Showing return popup for shortcode:", currentShortcodeRef.current)
          setReturnGameShortcode(currentShortcodeRef.current) // Use current shortcode from ref
          setShowReturnPopup(true)
          // Note: No auto-hide - user will manually dismiss
        }
        // Note: Don't call leaveGame() here - we want to keep the session active
      }

      // Hide popup if we're back in a game route
      if (pathname.includes("/game/live")) {
        setShowReturnPopup(false)
        setReturnGameShortcode(null)
      }

      prevPathnameRef.current = pathname
    }
  }, [pathname])

  const value = {
    joinGame,
    leaveGame: leaveGameEntirely, // Export the enhanced leave function
    isInGame: isInGameRef.current,
    currentShortcode: currentShortcodeRef.current,
  }

  return (
    <GameSessionContext.Provider value={value}>
      {children}

      {/* Return to Game Popup - Only show if not currently on game page */}
      <AnimatePresence>
        {showReturnPopup && returnGameShortcode && !pathname.includes("/game/live") && (
          <ReturnToGamePopup
            shortcode={returnGameShortcode}
            onReturn={handleReturnToGame}
            onDismiss={handleDismissPopup}
          />
        )}
      </AnimatePresence>
    </GameSessionContext.Provider>
  )
}

export function useGameSession(): GameSessionContextType {
  const context = useContext(GameSessionContext)
  if (!context) {
    throw new Error("useGameSession must be used within a GameSessionProvider")
  }
  return context
}
