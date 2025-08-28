"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
import { GameMode } from "@shared/constants/allgamemodes"
import { validateTimeControl } from "@shared/utils/validation"
import { getRankedGameModeByTimeControl } from "@shared/utils/gamemodes"
import { myConfig } from "@/config/env"
import { useRecaptcha } from "../providers/RecaptchaProvider"

type CommonModes = "standard" | "armageddon" | "friendly" | "casual"

type TabType = "new-game" | "live-games" | "live-players"

interface TimeControl {
  id: string
  base: number // Base time in minutes
  bonus: number // Bonus time in seconds
  initial: number // Initial time in seconds
  selected?: boolean
}

interface myGameMode {
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
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>("new-game")
  const [showCustomTimings, setShowCustomTimings] = useState(false)
  const [casualDropdownOpen, setCasualDropdownOpen] = useState(false)
  const [selectedGameMode, setSelectedGameMode] = useState<CommonModes>("standard")
  const [showInfoTooltip, setShowInfoTooltip] = useState(false) // State for the info tooltip

  // Pagination states for Live Games and Live Players
  const [currentPageLiveGames, setCurrentPageLiveGames] = useState(1)
  const [currentPageLivePlayers, setCurrentPageLivePlayers] = useState(1)
  const itemsPerPage = 5 // Assuming 5 items per page for simplicity

  // Custom timing states
  const [baseTime, setBaseTime] = useState(3) // minutes
  const [bonusTime, setBonusTime] = useState(2) // seconds
  const [initialBonus, setInitialBonus] = useState(10) // seconds
  const [isStartingGame, setIsStartingGame] = useState(false) // Cooldown state
  const [cooldownSeconds, setCooldownSeconds] = useState(0) // Cooldown timer
  const { getRecaptchaToken, isRecaptchaActive, activateRecaptcha } = useRecaptcha()
  const router = useRouter()

  useEffect(() => {
    // Activate reCAPTCHA when the component mounts
    activateRecaptcha()
  }, []);

  const tabs = [
    { id: "new-game" as TabType, label: "New Game", icon: Zap, iconColor: "text-brand-accent-yellow" },
    { id: "live-games" as TabType, label: "Live Games", icon: Gamepad2, iconColor: "text-brand-accent-green" },
    { id: "live-players" as TabType, label: "Live Players", icon: User, iconColor: "text-brand-accent-green" },
  ]

  const gameModes: myGameMode[] = [
    {
      id: "bullet",
      name: "Bullet",
      icon: Rocket,
      iconColor: "text-brand-accent-green",
      timeControls: [
        { id: "1|0|0", base: 1, bonus: 0, initial: 0, selected : true },
        { id: "1|1|5", base: 1, bonus: 1, initial: 5 },
        { id: "2|0|0", base: 2, bonus: 0, initial: 0 },
      ],
    },
    {
      id: "blitz",
      name: "Blitz",
      icon: Zap,
      iconColor: "text-brand-accent-yellow",
      timeControls: [
        { id: "3|0|0", base: 3, bonus: 0, initial: 0 },
        { id: "3|2|10", base: 3, bonus: 2, initial: 10 },
        { id: "4|0|20", base: 4, bonus: 0, initial: 20 },
      ],
    },
    {
      id: "rapid",
      name: "Rapid",
      icon: TreePine,
      iconColor: "text-white",
      timeControls: [
        { id: "10| 0|30", base: 10, bonus: 0, initial: 30 },
        { id: "15| 0|0", base: 15, bonus: 0, initial: 0 },
        { id: "10|30|60", base: 10, bonus: 30, initial: 60 },
      ],
    },
  ]

  const casualOptions = [
    { id: "standard", label: "Ranked", icon: Rocket }, // Rocket for competitive/ranked
    { id: "armageddon", label: "Ranked (Armageddon)", icon: Zap }, // Zap for special/fast mode
    { id: "friendly", label: "Friendly", icon: User }, // User for friendly
    { id: "casual", label: "Casual", icon: TreePine }, // TreePine for casual
  ]

  const mockLiveGames: LiveGame[] = [
    { id: "1", playerName: "Player", rating: 1809, timeControl: "30+7-1", mode: "Ranked" },
    { id: "2", playerName: "Player", rating: 1650, timeControl: "5+3", mode: "Armageddon" },
    { id: "3", playerName: "Player", rating: 1420, timeControl: "10+0", mode: "Casual" },
    { id: "4", playerName: "Player", rating: 1890, timeControl: "3+2", mode: "Armageddon" },
    { id: "5", playerName: "Player", rating: 1234, timeControl: "15+10", mode: "Ranked" },
    { id: "6", playerName: "Player6", rating: 1700, timeControl: "3+0", mode: "Casual" },
    { id: "7", playerName: "Player7", rating: 1900, timeControl: "10+0", mode: "Casual" },
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

  const handleTimeControlSelect = (base: number, bonus: number, initial: number) => {
    setBaseTime(base);
    setBonusTime(bonus);
    setInitialBonus(initial);
  };

  const getTimeControlLabel = () => {
    return `${baseTime} min | ${bonusTime} sec | ${initialBonus} sec`;
  };

  // Helper function to determine the current game mode type based on time settings
  const getCurrentGameModeType = () => {
    // Custom timing
    if (showCustomTimings) return "Custom";
    
    // Check if it matches a bullet configuration
    if (baseTime <= 2) return "Bullet";
    
    // Check if it matches a blitz configuration
    if (baseTime <= 5) return "Blitz";
    
    // Otherwise it's rapid
    return "Rapid";
  };

  const handleStartGame = async () => {
    if (isStartingGame) return // Prevent multiple submissions during cooldown

    setIsStartingGame(true)
    setCooldownSeconds(5)

    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setIsStartingGame(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Send game request immediately
    const tc = {
      base_time: baseTime * 60,
      increment: bonusTime,
      disadvantage: initialBonus
    };

    let gamemode;
    if (selectedGameMode === "standard" || selectedGameMode === "armageddon") {
      gamemode = getRankedGameModeByTimeControl(tc, selectedGameMode as CommonModes);
    } else if (selectedGameMode === "friendly") {
      gamemode = GameMode.STANDARD_FRIENDLY;
    } else if (selectedGameMode === "casual") {
      gamemode = GameMode.STANDARD_PUBLIC_CASUAL;
    } else {
      console.error("Invalid game mode selected");
      return;
    }

    if (!isRecaptchaActive) { 
      console.error("reCAPTCHA is not active. Cannot start game.");
      return;
    }

    try {
      const response = await fetch(`${myConfig.BACKEND_URL}/game/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gamemode,
          time_control: tc,
          recaptchaToken: await getRecaptchaToken(),
        }),
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to start game:", await response.json());
        return;
      }

      const gameLink = await response.json() as { gameLink: string };
      router.replace(gameLink.gameLink);

    } catch (error) {
      console.error("Error starting game:", error);
    }
  }

  const handleCancelSearch = () => {
    console.log("Game search cancelled by user");
    setIsStartingGame(false)
    setCooldownSeconds(0)
  }

  const handleCustomTimingsSave = () => {
    // Construct a label for custom timings
    // You might want to generate a unique ID for custom timings if they can be saved/reused
    if (validateTimeControl({ base_time: baseTime * 60, increment: bonusTime, disadvantage: initialBonus })) {
      setShowCustomTimings(false)
    }
  }

  const handleDropdownClose = (event: React.MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest(".dropdown-container")) {
      setCasualDropdownOpen(false)
    }
  }

  const renderNewGameTab = () => (
    <motion.div
      className="flex flex-col p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleDropdownClose} // Close dropdown when clicking outside
    >
      {/* Casual Section - Moved above time control display */}
      <div className="space-y-2 mb-4">
        <div className="relative dropdown-container">
          <button
            onClick={() => setCasualDropdownOpen(!casualDropdownOpen)}
            className="w-full flex items-center justify-between bg-brand-primary/60 hover:bg-brand-primary/80 rounded-lg p-3 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <TreePine className="w-5 h-5 text-brand-accent-green" />
              <span className="text-white font-semibold text-base">
                {casualOptions.find((opt) => opt.id === selectedGameMode)?.label || "Casual"}
              </span>
            </div>
            <motion.div animate={{ rotate: casualDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-5 h-5 text-white" />
            </motion.div>
          </button>

          <AnimatePresence>
            {casualDropdownOpen && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-1 bg-brand-primary rounded-lg overflow-hidden z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {casualOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedGameMode(option.id as CommonModes)
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

      {/* Time Control Display and Info Icon - Moved below game mode selection */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-white font-bold text-base">{getCurrentGameModeType()}: {getTimeControlLabel()}</div>
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
                1 | 2 | 3 :                                                        <br/>
                1: Base time (starting time for both players)                      <br/>
                2: Bonus per move (time added after making each move)              <br/>
                3: Disadvantage for red (for more explanation visit /info)
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
                  onClick={() => handleTimeControlSelect(control.base, control.bonus, control.initial)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 flex-grow",
                    baseTime === control.base && bonusTime === control.bonus && initialBonus === control.initial
                      ? "bg-brand-primary/80 ring-1 ring-brand-accent-green"
                      : "bg-brand-primary/60 hover:bg-brand-primary/80",
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {control.id}
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
        className="w-full p-3 bg-brand-primary/60 hover:bg-brand-primary/80 rounded-lg text-white font-semibold text-base transition-all duration-200 flex justify-between items-center mt-auto" // Adjusted to keep arrow aligned right and text centered
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span className="flex-1 text-center">Custom Timings</span>
        {showCustomTimings ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </motion.button>

      {/* Start Game Button - pushed to bottom */}
      <Button
        onClick={isStartingGame ? handleCancelSearch : handleStartGame}
        disabled={false}
        className={cn(
          "w-full h-12 text-base font-bold rounded-lg mt-2",
          isStartingGame 
            ? "bg-red-600 hover:bg-red-700 text-white" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
        )}
      >
        {isStartingGame 
          ? `Cancel Game Search (${cooldownSeconds}s)` 
          : "Start Game"}
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

  const baseTimeValues = [
    0, 0.25, 0.5, 1, 2, 3,
    ...Array.from({ length: 28 }, (_, i) => 3 + i), // Linear extrapolation between 3 and 30
    ...Array.from({ length: 6 }, (_, i) => 35 + i * 5), // Linear extrapolation between 35 and 60 with delta 5
    ...Array.from({ length: 11 }, (_, i) => 80 + i * 10), // Linear extrapolation between 80 and 180 with delta 10
  ];

  const customSetBaseTime = (sliderValue: number) => {
    const newBaseTime = baseTimeValues[sliderValue];
    setBaseTime(newBaseTime);
  };

  // Initialize game mode from URL parameter
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam) {
      const validModes: CommonModes[] = ["standard", "armageddon", "friendly", "casual"]
      if (validModes.includes(modeParam as CommonModes)) {
        setSelectedGameMode(modeParam as CommonModes)
      }
    }
  }, [searchParams])

  return (
    <motion.div
          className="space-y-6 p-4 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          onClick={handleDropdownClose} // Close dropdown when clicking outside
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Custom overlay */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomTimings(false)}
            />
            
            {/* Modal content */}
            <motion.div
              className="relative bg-brand-secondary rounded-2xl p-6 w-full max-w-md space-y-6 pointer-events-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white text-center">Custom Timings</h2>

              {/* Base Time Slider */}
              <div className="space-y-3">
                <label className="text-white text-lg font-medium">Base time per side: {baseTime}m</label>
                <Slider
                  value={baseTimeValues.indexOf(baseTime)}
                  onChange={customSetBaseTime}
                  min={0}
                  max={baseTimeValues.length - 1}
                  step={1}
                />
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
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
