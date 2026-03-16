"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Zap } from "lucide-react"
import type { GameHistoryEntry } from "@/app/profile/page"

interface GameHistoryTableProps {
  entries:    GameHistoryEntry[]
  totalGames: number
  username:   string   // the current user's name — used to place them in position 1 or 2
}

const PAGE_SIZE = 8

const MODE_COLORS: Record<string, string> = {
  blitz:  "#eab308",
  bullet: "#8b5cf6",
  rapid:  "#ec4899",
}

function ModeCell({ mode, timeControl }: { mode: string; timeControl: string }) {
  const color = MODE_COLORS[mode] ?? "#fff"
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Zap className="w-4 h-4" style={{ color }} fill={color} />
      <span className="text-[10px] text-gray-300">{timeControl}</span>
    </div>
  )
}

function ResultBadge({ result }: { result: "win" | "loss" | "draw" }) {
  const map = {
    win:  { label: "WIN",  cls: "text-brand-accent-green" },
    loss: { label: "LOSS", cls: "text-brand-accent-red"   },
    draw: { label: "DRAW", cls: "text-yellow-400"         },
  }
  const { label, cls } = map[result]
  return <span className={`text-xs font-bold ${cls}`}>{label}</span>
}

function RatingGain({ gain }: { gain: number }) {
  const isPos = gain > 0
  const isNeg = gain < 0
  return (
    <span className={`text-sm font-bold ${isPos ? "text-brand-accent-green" : isNeg ? "text-brand-accent-red" : "text-gray-400"}`}>
      {isPos ? `+${gain}` : gain}
    </span>
  )
}

/**
 * PlayerCell
 *
 * Renders two rows: player 1 on top, player 2 below.
 * If the current user is player 1, they appear first (top) with their rating above.
 * If the current user is player 2, the opponent is on top and the user is below.
 */
function PlayerCell({
  username,
  opponentName,
  myRating,
  opponentRating,
  playerPosition,
}: {
  username:       string
  opponentName:   string
  myRating:       number
  opponentRating: number
  playerPosition: 1 | 2
}) {
  // player 1 is always shown first (top row)
  const rows =
    playerPosition === 1
      ? [
          { name: username,     rating: myRating,       isMe: true  },
          { name: opponentName, rating: opponentRating, isMe: false },
        ]
      : [
          { name: opponentName, rating: opponentRating, isMe: false },
          { name: username,     rating: myRating,       isMe: true  },
        ]

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-1 min-w-0">
          <span
            className={`text-xs truncate font-semibold ${
              r.isMe ? "text-brand-accent-green" : "text-brand-accent-red"
            }`}
          >
            {r.name}
          </span>
          <span className="text-[10px] text-gray-400 flex-shrink-0">({r.rating})</span>
        </div>
      ))}
    </div>
  )
}

export function GameHistoryTable({ entries, totalGames, username }: GameHistoryTableProps) {
  const [tab,  setTab]  = useState<"history" | "stats">("history")
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(entries.length / PAGE_SIZE)
  const visible    = entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <motion.div
      className="bg-brand-primary/50 rounded-2xl overflow-hidden border border-brand-border/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-brand-border/30">
        {(["history", "stats"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-3.5 text-sm font-semibold transition-colors duration-200 ${
              tab === t ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "history" ? (
              <>
                Game History{" "}
                <span className="text-brand-accent-yellow">({totalGames.toLocaleString()})</span>
              </>
            ) : (
              "Stats"
            )}
            {tab === t && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                layoutId="tab-indicator"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "history" ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Column headers */}
            <div className="grid grid-cols-[48px_80px_1fr_56px_64px_72px] gap-x-2 px-3 py-2 border-b border-brand-border/20">
              {["MODE", "DATE", "PLAYER", "RESULT", "ACCURACY", "RATING GAIN"].map((h) => (
                <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-brand-border/10">
              <AnimatePresence initial={false}>
                {visible.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    className="grid grid-cols-[48px_80px_1fr_56px_64px_72px] gap-x-2 items-center px-3 py-3 hover:bg-brand-hover/30 transition-colors duration-150"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                  >
                    <ModeCell mode={entry.mode} timeControl={entry.timeControl} />
                    <span className="text-[11px] text-gray-300 leading-tight">{entry.date}</span>
                    <PlayerCell
                      username={username}
                      opponentName={entry.opponentName}
                      myRating={entry.myRating}
                      opponentRating={entry.opponentRating}
                      playerPosition={entry.playerPosition}
                    />
                    <ResultBadge result={entry.result} />
                    <span className="text-sm text-white">{entry.accuracy}%</span>
                    <RatingGain gain={entry.ratingGain} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-brand-border/20">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded-lg hover:bg-brand-hover/50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <span className="text-xs text-gray-400">
                Page {page + 1} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded-lg bg-brand-primary/60 hover:bg-brand-hover/50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="stats"
            className="p-6 text-center text-gray-400 text-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            Stats coming soon.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
