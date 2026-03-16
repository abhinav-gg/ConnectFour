"use client"

import { motion } from "framer-motion"
import { Zap, ArrowUp, ArrowDown } from "lucide-react"

interface RatingEntry {
  rating: number
  change: number
}

interface RatingCardsProps {
  ratings: {
    blitz: RatingEntry
    bullet: RatingEntry
    rapid: RatingEntry
  }
}

const MODES = [
  { key: "blitz",  label: "Blitz"  },
  { key: "bullet", label: "Bullet" },
  { key: "rapid",  label: "Rapid"  },
] as const

function RatingCard({
  label,
  rating,
  change,
  delay,
}: {
  label: string
  rating: number
  change: number
  delay: number
}) {
  const isPositive = change > 0
  const isNeutral  = change === 0

  return (
    <motion.div
      className="flex-1 bg-brand-primary/70 rounded-2xl border border-brand-border/30 px-4 py-4 flex items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
    >
      <Zap className="w-8 h-8 flex-shrink-0 text-yellow-400" fill="#eab308" />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">{label}</p>
        <p className="text-3xl font-bold text-white leading-tight">{rating}</p>
      </div>

      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        {isNeutral ? (
          <>
            <ArrowUp   className="w-4 h-4 text-brand-accent-green opacity-50" />
            <ArrowDown className="w-4 h-4 text-brand-accent-green opacity-50" />
          </>
        ) : isPositive ? (
          <ArrowUp className="w-5 h-5 text-brand-accent-green" />
        ) : (
          <ArrowDown className="w-5 h-5 text-brand-accent-red" />
        )}
        <span
          className={`text-lg font-bold ${
            isNeutral
              ? "text-brand-accent-green opacity-70"
              : isPositive
              ? "text-brand-accent-green"
              : "text-brand-accent-red"
          }`}
        >
          {change}
        </span>
      </div>
    </motion.div>
  )
}

export function RatingCards({ ratings }: RatingCardsProps) {
  return (
    <div className="flex gap-3 flex-wrap md:flex-nowrap">
      {MODES.map((mode, i) => (
        <RatingCard
          key={mode.key}
          label={mode.label}
          rating={ratings[mode.key].rating}
          change={ratings[mode.key].change}
          delay={0.2 + i * 0.07}
        />
      ))}
    </div>
  )
}
