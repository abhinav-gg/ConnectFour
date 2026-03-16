"use client"

import { Layout }           from "@/components/layouts/mainlayout"
import { AdPlaceholder }    from "@/components/ads"
import { ProfileHeader }    from "@/components/profile/profile-header"
import { ProgressionChart } from "@/components/profile/progression-chart"
import { RatingCards }      from "@/components/profile/rating-cards"
import { GameHistoryTable } from "@/components/profile/game-history-table"
import type { ProgressionDataPoint } from "@/components/profile/progression-chart"
import { motion }           from "framer-motion"

// ─── PROFILE ─────────────────────────────────────────────────────────────────
// Replace with real user data from your API / auth session.
const PROFILE_DATA = {
  username: "Yetiowner",
  avatarUrl: "",   // Insert avatar image URL here
  moreComingSoonTooltip:
    "Friends lists, achievements, tournament history and much more are on the way. Stay tuned!",
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── RATINGS ─────────────────────────────────────────────────────────────────
// Replace with real rating data from your API.
// `change` is the ELO delta since last session (positive = gained, negative = lost).
const RATINGS_DATA = {
  blitz:  { rating: 1082, change:   0 },
  bullet: { rating: 1010, change:  20 },
  rapid:  { rating: 1150, change: -12 },
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── PROGRESSION CHART ───────────────────────────────────────────────────────
// Replace with real monthly ELO data from your API.
// Values must be >= 0 (ELO cannot be negative).
// Each entry: { month, blitz, bullet, rapid }
const PROGRESSION_DATA: ProgressionDataPoint[] = [
  { month: "Jan", blitz: 1000, bullet:  980, rapid: 1020 },
  { month: "Feb", blitz: 1015, bullet: 1005, rapid:  995 },
  { month: "Mar", blitz:  990, bullet: 1020, rapid: 1050 },
  { month: "Apr", blitz: 1030, bullet:  975, rapid: 1080 },
  { month: "May", blitz: 1055, bullet: 1040, rapid: 1120 },
  { month: "Jun", blitz: 1082, bullet: 1010, rapid: 1150 },
]
// ─────────────────────────────────────────────────────────────────────────────

// ─── GAME HISTORY TYPE ────────────────────────────────────────────────────────
export type GameHistoryEntry = {
  id:             string
  mode:           "blitz" | "bullet" | "rapid"
  timeControl:    string
  date:           string
  opponentName:   string
  opponentRating: number
  myRating:       number
  /**
   * playerPosition — whether the current user was player 1 or player 2 in this game.
   * 1 = current user moves first (shown on top row in the Player column)
   * 2 = current user moves second (shown on bottom row in the Player column)
   */
  playerPosition: 1 | 2
  result:         "win" | "loss" | "draw"
  score:          string   // e.g. "0 / 1"
  accuracy:       number   // percentage 0–100
  ratingGain:     number   // positive = gained ELO, negative = lost ELO
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── GAME HISTORY DATA ────────────────────────────────────────────────────────
// Replace with paginated data from your API.
const GAME_HISTORY: GameHistoryEntry[] = [
  {
    id: "1", mode: "blitz",  timeControl: "1|1|0", date: "24th Oct 2025",
    opponentName: "DragonSlayer", opponentRating: 970,  myRating: 1082,
    playerPosition: 1, result: "loss", score: "0 / 1", accuracy: 50,  ratingGain: -10,
  },
  {
    id: "2", mode: "bullet", timeControl: "1|0|0", date: "23rd Oct 2025",
    opponentName: "ChessKing99",  opponentRating: 1100, myRating: 1082,
    playerPosition: 2, result: "win",  score: "1 / 0", accuracy: 72,  ratingGain:  14,
  },
  {
    id: "3", mode: "rapid",  timeControl: "5|0|0", date: "22nd Oct 2025",
    opponentName: "QuickDrop",    opponentRating: 1045, myRating: 1082,
    playerPosition: 1, result: "win",  score: "1 / 0", accuracy: 81,  ratingGain:  12,
  },
  {
    id: "4", mode: "blitz",  timeControl: "1|1|0", date: "21st Oct 2025",
    opponentName: "FourInARow",   opponentRating: 1200, myRating: 1082,
    playerPosition: 2, result: "loss", score: "0 / 1", accuracy: 44,  ratingGain:  -8,
  },
  {
    id: "5", mode: "rapid",  timeControl: "5|0|0", date: "20th Oct 2025",
    opponentName: "DropMaster",   opponentRating: 990,  myRating: 1082,
    playerPosition: 1, result: "draw", score: "½ / ½", accuracy: 63,  ratingGain:   2,
  },
  {
    id: "6", mode: "bullet", timeControl: "1|0|0", date: "19th Oct 2025",
    opponentName: "GridLock42",   opponentRating: 1055, myRating: 1082,
    playerPosition: 2, result: "win",  score: "1 / 0", accuracy: 68,  ratingGain:  10,
  },
  {
    id: "7", mode: "blitz",  timeControl: "2|1|0", date: "18th Oct 2025",
    opponentName: "NightOwl",     opponentRating: 1130, myRating: 1082,
    playerPosition: 1, result: "loss", score: "0 / 1", accuracy: 39,  ratingGain: -11,
  },
  {
    id: "8", mode: "rapid",  timeControl: "5|0|0", date: "17th Oct 2025",
    opponentName: "VortexViper",  opponentRating: 1010, myRating: 1082,
    playerPosition: 2, result: "win",  score: "1 / 0", accuracy: 77,  ratingGain:   8,
  },
  {
    id: "9", mode: "blitz",  timeControl: "1|1|0", date: "16th Oct 2025",
    opponentName: "StormBreaker", opponentRating: 1090, myRating: 1082,
    playerPosition: 1, result: "draw", score: "½ / ½", accuracy: 55,  ratingGain:   1,
  },
]
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <Layout>
      <motion.div
        className="pt-16 pb-8 space-y-5 max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="bg-brand-primary/60 rounded-2xl border border-brand-border/30 p-5 space-y-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <ProfileHeader
            username={PROFILE_DATA.username}
            avatarUrl={PROFILE_DATA.avatarUrl}
            moreComingSoonTooltip={PROFILE_DATA.moreComingSoonTooltip}
          />

          <ProgressionChart data={PROGRESSION_DATA} />

          <RatingCards ratings={RATINGS_DATA} />

          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <GameHistoryTable
                entries={GAME_HISTORY}
                totalGames={2402}
                username={PROFILE_DATA.username}
              />
            </div>
            <AdPlaceholder />
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  )
}
