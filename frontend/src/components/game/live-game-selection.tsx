"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Zap,
  Gamepad2,
  User,
  ChevronDown,
  ChevronUp,
  TreePine,
  Rocket,
  Info,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react"
import { cn } from "@/utils/cn"

type TabType = "new-game" | "live-games" | "live-players"

interface TimeControl {
  id: string
  label: string // Full label with min/sec
  displayLabel: string // Simplified label for buttons
  selected?: boolean
}

interface GameMode {
  id: string
  name: string
  icon: React.ElementType
  iconColor: string
  timeControls: TimeControl[]
}

interface LiveGame {
  id: string
  playerName: string
  rating: number
  timeControl: string
  mode: string
}

interface LivePlayer {
  id: string
  playerName: string
  rating: string
  game: string
}

export function LiveGameSelection() {
  const [activeTab, setActiveTab] = useState<TabType>("new-game")
  const [showCustomTimings, setShowCustomTimings] = useState(false)
  const [selectedTimeControl, setSelectedTimeControl] = useState("1min-0-0")
  const [casualDropdownOpen, setCasualDropdownOpen] = useState(false)
  const [selectedCasualOption, setSelectedCasualOption] = useState("casual")
  const [showInfoTooltip, setShowInfoTooltip] = useState(false) // State for the info tooltip

  // Pagination states for Live Games and Live Players
  const [currentPageLiveGames, setCurrentPageLiveGames] = useState(1)
  const [currentPageLivePlayers, setCurrentPageLivePlayers] = useState(1)
  const itemsPerPage = 5 // Assuming 5 items per page for simplicity

  // Custom timing states
  const [baseTime, setBaseTime] = useState(15) // minutes
  const [bonusTime, setBonusTime] = useState(5) // seconds
  const [initialBonus, setInitialBonus] = useState(5) // seconds

  const tabs = [
    { id: "new-game" as TabType, label: "New Game", icon: Zap, iconColor: "text-brand-accent-yellow" },
    { id: "live-games" as TabType, label: "Live Games", icon: Gamepad2, iconColor: "text-brand-accent-green" },
    { id: "live-players" as TabType, label: "Live Players", icon: User, iconColor: "text-brand-accent-green" },
  ]

  const gameModes: GameMode[] = [
    {
      id: "bullet",
      name: "Bullet",
      icon: Rocket,
      iconColor: "text-brand-accent-green",
      timeControls: [
        { id: "1min-0-0", label: "1 min | 0 sec | 0 sec", displayLabel: "1 | 0 | 0", selected: true },
        { id: "1min-1sec-5sec", label: "1 min | 1 sec | 5 sec", displayLabel: "1 | 1 | 5" },
        { id: "2min-0-0", label: "2 min | 0 sec | 0 sec", displayLabel: "2 | 0 | 0" },
      ],
    },
    {
      id: "blitz",
      name: "Blitz",
      icon: Zap,
      iconColor: "text-brand-accent-yellow",
      timeControls: [
        { id: "3min-0-0", label: "3 min | 0 sec | 0 sec", displayLabel: "3 | 0 | 0" },
        { id: "3min-2sec-10sec", label: "3 min | 2 sec | 10 sec", displayLabel: "3 | 2 | 10" },
        { id: "5min-0-30sec", label: "5 min | 0 sec | 30 sec", displayLabel: "5 | 0 | 30" },
      ],
    },
    {
      id: "rapid",
      name: "Rapid",
      icon: TreePine,
      iconColor: "text-white",
      timeControls: [
        { id: "10min-0-30sec", label: "10 min | 0 sec | 30 sec", displayLabel: "10 | 0 | 30" },
        { id: "15min-0-0", label: "15 min | 0 sec | 0 sec", displayLabel: "15 | 0 | 0" },
        { id: "10min-30sec-1min", label: "10 min | 30 sec | 1 min", displayLabel: "10 | 30 | 1" },
      ],
    },
  ]

  const casualOptions = [
    { id: "casual", label: "Casual", icon: TreePine },
    { id: "ranked", label: "Ranked", icon: Pencil }, // Changed label to "Ranked"
  ]

  const mockLiveGames: LiveGame[] = [
    { id: "1", playerName: "Player", rating: 1809, timeControl: "30+7-1", mode: "Ranked Blitz" },
    { id: "2", playerName: "Player", rating: 1650, timeControl: "5+3", mode: "Blitz" },
    { id: "3", playerName: "Player", rating: 1420, timeControl: "10+0", mode: "Rapid" },
    { id: "4", playerName: "Player", rating: 1890, timeControl: "3+2", mode: "Blitz" },
    { id: "5", playerName: "Player", rating: 1234, timeControl: "15+10", mode: "Rapid" },
    { id: "6", playerName: "Player6", rating: 1700, timeControl: "3+0", mode: "Blitz" },
    { id: "7", playerName: "Player7", rating: 1900, timeControl: "10+0", mode: "Rapid" },
  ]

  const mockLivePlayers: LivePlayer[] = [
    { id: "1", playerName: "Player", rating: "Rating", game: "SHORTCODE" },
    { id: "2", playerName: "Player", rating: "Rating", game: "SHORTCODE" },
    { id: "3", playerName: "Player", rating: "Rating", game: "SHORTCODE" },
    { id: "4", playerName: "Player", rating: "Rating", game: "SHORTCODE" },
    { id: "5", playerName: "Player", rating: "Rating", game: "SHORTCODE" },
    { id: "6", playerName: "Player6", rating: "Rating", game: "SHORTCODE" },
    { id: "7", playerName: "Player7", rating: "Rating", game: "SHORTCODE" },
  ]

  // Helper to get the full label for display
  const getFullTimeControlLabel = (id: string) => {
    for (const mode of gameModes) {
      const control = mode.timeControls.find((tc) => tc.id === id)
      if (control) return control.label
    }
    // For custom timings, construct the label
    if (id.startsWith("custom-")) {
      const parts = id.split("-")
      return `${parts[1]} min | ${parts[2]} sec | ${parts[3]} sec`
    }
    return "Custom" // Fallback for custom timings
  }

  const handleTimeControlSelect = (controlId: string) => {
    setSelectedTimeControl(controlId)
  }

  const handleStartGame = () => {
    console.log("Starting game with:", selectedTimeControl)
  }

  const handleCustomTimingsSave = () => {
    // Construct a label for custom timings
    // You might want to generate a unique ID for custom timings if they can be saved/reused
    setSelectedTimeControl(`custom-${baseTime}-${bonusTime}-${initialBonus}`)
    setShowCustomTimings(false)
  }

  const renderNewGameTab = () => (
    <motion.div
      className="flex flex-col p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Current Time Control Display and Info Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-white font-bold text-base">Current: {getFullTimeControlLabel(selectedTimeControl)}</div>
        <div
          className="relative"
          onMouseEnter={() => setShowInfoTooltip(true)}
          onMouseLeave={() => setShowInfoTooltip(false)}
        >
          <Info className="w-5 h-5 text-brand-text-muted cursor-help" />
          <AnimatePresence>
            {showInfoTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-full top-1/2 -translate-y-1/2 mr-2 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-20"
              >
                Base time | Bonus per move | Initial bonus
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Casual Section */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <button
            onClick={() => setCasualDropdownOpen(!casualDropdownOpen)}
            className="w-full flex items-center justify-between bg-brand-primary/60 hover:bg-brand-primary/80 rounded-lg p-3 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <TreePine className="w-5 h-5 text-brand-accent-green" />
              <span className="text-white font-semibold text-base">
                {casualOptions.find((opt) => opt.id === selectedCasualOption)?.label || "Casual"}
              </span>
            </div>
            <motion.div animate={{ rotate: casualDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-5 h-5 text-white" />
            </motion.div>
          </button>

          <AnimatePresence>
            {casualDropdownOpen && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-1 bg-brand-primary rounded-lg overflow-hidden z-10" // Changed to bg-brand-primary
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {casualOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedCasualOption(option.id)
                      setCasualDropdownOpen(false)
                    }}
                    className="w-full flex items-center gap-2 p-3 hover:bg-brand-hover transition-colors duration-200"
                  >
                    <option.icon className="w-5 h-5 text-brand-accent-green" />
                    <span className="text-white text-base">{option.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Game Modes - This section takes up available space */}
      <div className="flex-1 flex flex-col space-y-4">
        {gameModes.map((mode) => (
          <div key={mode.id} className={cn("space-y-2", { "mb-6": mode.id === "rapid" })}>
            {" "}
            {/* Increased mb for Rapid */}
            <div className="flex items-center gap-2">
              <mode.icon className={cn("w-5 h-5", mode.iconColor)} />
              <h3 className="text-white font-semibold text-base flex items-center gap-1">{mode.name}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {mode.timeControls.map((control) => (
                <motion.button
                  key={control.id}
                  onClick={() => handleTimeControlSelect(control.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 flex-grow" /* Adjusted padding and font size */,
                    selectedTimeControl === control.id
                      ? "bg-brand-primary/80 ring-1 ring-brand-accent-green"
                      : "bg-brand-primary/60 hover:bg-brand-primary/80",
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {control.displayLabel}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
        <br/><br/>
      {/* Custom Timings button - pushed to bottom */}
      <motion.button
        onClick={() => setShowCustomTimings(!showCustomTimings)}
        className="w-full p-3 bg-brand-primary/60 hover:bg-brand-primary/80 rounded-lg text-white font-semibold text-base transition-all duration-200 flex items-center justify-between mt-auto" // mt-auto to push to bottom
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        Custom Timings
        {showCustomTimings ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </motion.button>

      {/* Start Game Button - pushed to bottom */}
      <Button
        onClick={handleStartGame}
        className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg mt-2" // mt-2 for small gap
      >
        Start Game
      </Button>
    </motion.div>
  )

  const renderLiveGamesTab = () => (
    <motion.div
      className="flex flex-col h-full space-y-4 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Table Header */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-brand-primary/40 rounded-lg text-brand-text-muted font-medium text-sm">
        <span>Player</span>
        <span>Rating</span>
        <span>Time</span>
        <span>Mode</span>
      </div>

      {/* Table Rows */}
      <div className="flex-1 space-y-2">
        {mockLiveGames
          .slice((currentPageLiveGames - 1) * itemsPerPage, currentPageLiveGames * itemsPerPage)
          .map((game) => (
            <motion.div
              key={game.id}
              className="grid grid-cols-4 gap-2 p-4 bg-brand-primary/60 hover:bg-brand-primary/80 rounded-lg transition-all duration-200 cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-white text-xs">I</span>
                </div>
                <span className="text-white text-base truncate">{game.playerName}</span>
              </div>
              <span className="text-white text-base">{game.rating}</span>
              <span className="text-white text-base">{game.timeControl}</span>
              <span className="text-white text-base truncate">{game.mode}</span>
            </motion.div>
          ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 mt-auto">
        <Button
          variant="ghost"
          size="icon"
          className="text-white h-10 w-10"
          onClick={() => setCurrentPageLiveGames((prev) => Math.max(1, prev - 1))}
          disabled={currentPageLiveGames === 1}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white h-10 w-10"
          onClick={() => setCurrentPageLiveGames((prev) => prev + 1)}
          disabled={currentPageLiveGames * itemsPerPage >= mockLiveGames.length}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  )

  const renderLivePlayersTab = () => (
    <motion.div
      className="flex flex-col h-full space-y-4 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Table Header */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-brand-primary/40 rounded-lg text-brand-text-muted font-medium text-sm">
        <span>Player</span>
        <span>Rating</span>
        <span>Game</span>
      </div>

      {/* Table Rows */}
      <div className="flex-1 space-y-2">
        {mockLivePlayers
          .slice((currentPageLivePlayers - 1) * itemsPerPage, currentPageLivePlayers * itemsPerPage)
          .map((player) => (
            <motion.div
              key={player.id}
              className="grid grid-cols-3 gap-2 p-4 bg-brand-primary/60 hover:bg-brand-primary/80 rounded-lg transition-all duration-200 cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-white text-xs">I</span>
                </div>
                <span className="text-white text-base truncate">{player.playerName}</span>
              </div>
              <span className="text-white text-base">{player.rating}</span>
              <span className="text-white text-base">{player.game}</span>
            </motion.div>
          ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 mt-auto">
        <Button
          variant="ghost"
          size="icon"
          className="text-white h-10 w-10"
          onClick={() => setCurrentPageLivePlayers((prev) => Math.max(1, prev - 1))}
          disabled={currentPageLivePlayers === 1}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white h-10 w-10"
          onClick={() => setCurrentPageLivePlayers((prev) => prev + 1)}
          disabled={currentPageLivePlayers * itemsPerPage >= mockLivePlayers.length}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  )

  return (
    <motion.div
          className="space-y-6 p-4 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200",
              activeTab === tab.id
                ? "bg-brand-primary/80 text-white"
                : "bg-brand-primary/40 text-brand-text-muted hover:bg-brand-primary/60",
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className={cn("w-5 h-5", tab.iconColor)} />
            <span className="font-medium text-sm">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "new-game" && renderNewGameTab()}
          {activeTab === "live-games" && renderLiveGamesTab()}
          {activeTab === "live-players" && renderLivePlayersTab()}
        </AnimatePresence>
      </div>

      {/* Custom Timings Modal */}
      <AnimatePresence>
        {showCustomTimings && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCustomTimings(false)}
          >
            <motion.div
              className="bg-brand-secondary rounded-2xl p-6 w-full max-w-md space-y-6"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white text-center">Custom Timings</h2>

              {/* Base Time Slider */}
              <div className="space-y-3">
                <label className="text-white text-lg font-medium">Base time per side: {baseTime}m</label>
                <Slider value={baseTime} onChange={setBaseTime} min={1} max={60} step={1} />
              </div>

              {/* Bonus Time Slider */}
              <div className="space-y-3">
                <label className="text-white text-lg font-medium">Bonus time per move: {bonusTime}s</label>
                <Slider value={bonusTime} onChange={setBonusTime} min={0} max={30} step={1} />
              </div>

              {/* Initial Bonus Slider */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-text-muted" />
                  <label className="text-white text-lg font-medium">Initial bonus for player 2: {initialBonus}s</label>
                </div>
                <Slider value={initialBonus} onChange={setInitialBonus} min={0} max={60} step={1} />
              </div>

              {/* Note */}
              <p className="text-brand-text-muted text-sm text-center">
                Note: custom time games may have longer waiting times than the standard options for competitive matches
              </p>

              {/* Save Button */}
              <Button
                onClick={handleCustomTimingsSave}
                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Save
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
