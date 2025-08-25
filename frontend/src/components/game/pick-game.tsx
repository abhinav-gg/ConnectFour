"use client"
import { motion } from "framer-motion"
import { Zap, User, Bot, LayoutGrid, ArrowRight, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"


export function GameSelect() {
  const router = useRouter()

  const gameModes = [
    {
      title: "Play Online",
      description: "Play a ranked game with someone at your level",
      icon: Zap,
      href: "/play/setup?mode=standard",
      soon: false,
    },
    {
      title: "Play A Friend",
      description: "Play a casual game against someone you know",
      icon: User,
      href: "/play/setup?mode=friendly",
      soon: false,
    },
    {
      title: "Play A Bot",
      description: "Play a game with custom training bots",
      icon: Bot,
      extraIcon: Sparkles, // For the stars next to the bot
      extraIconColor: "text-brand-accent-orange",
      href: "/game/bot",
      soon: false,
    },
    {
      title: "View Tournaments",
      description: "Play in a live event!",
      icon: LayoutGrid, // Matching the visual style of the bracket
      href: "/tournaments",
      soon: true,
    },
    {
      title: "More Coming Soon",
      description: "Coming Soon...",
      icon: ArrowRight,
      href: "#",
      soon: true,
    },
  ]

  return (
    <motion.div
      className="space-y-4 lg:space-y-3 text-white h-full flex flex-col items-center justify-center" // Center content
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <img src="/logo-with-text.svg" alt="Con4 Logo" className="h-20 w-auto mb-8 lg:mb-6" />

      <nav className="w-full space-y-4">
        {gameModes.map((mode, index) => (
          <motion.button
            key={mode.title}
            onClick={() => {
              if (!mode.soon) {
                router.push(mode.href)
              }
            }}
            className={`
              flex items-center gap-4 lg:gap-6
              bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary 
              focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-primary 
              rounded-xl p-4 lg:p-5 w-full text-left transition-all duration-200
              ${mode.soon ? "opacity-60 cursor-not-allowed" : ""}
            `}
            disabled={mode.soon}
            whileHover={{ scale: mode.soon ? 1 : 1.02 }}
            whileTap={{ scale: mode.soon ? 1 : 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            aria-label={`${mode.title}: ${mode.description}`}
          >
            <div className="relative flex-shrink-0">
              <mode.icon className={`w-8 h-8 lg:w-10 lg:h-10 text-brand-accent-green`} aria-hidden="true" />
              {mode.extraIcon && mode.icon === Bot && (
                <mode.extraIcon
                  className={`absolute -bottom-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 ${mode.extraIconColor}`}
                  aria-hidden="true"
                />
              )}
            </div>
            <div>
              <div className="font-semibold text-xl lg:text-2xl">{mode.title}</div>
              <div className="text-sm lg:text-base text-brand-text-muted">
                {mode.soon && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-1 text-brand-accent-yellow">
                    SOON
                  </span>
                )}
                {mode.description}
              </div>
            </div>
          </motion.button>
        ))}
      </nav>
    </motion.div>
  )
}
