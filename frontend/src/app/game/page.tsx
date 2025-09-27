'use client'
/*
 * LiveGame Page with WebSocket Integration - Unified Layout
 * 
 * This page demonstrates WebSocket functionality with the new UnifiedGameLayout.
 * All user interactions are logged to console for debugging.
 * 
 * WebSocket Integration Points:
 * - handleSendMessage: Send chat messages to server
 * - handleColumnAttempt: Send moves to server
 * - useEffect: Simulate receiving messages/moves from server
 * 
 * Console Log Categories:
 * 🎮 Game Controls (start, pause, reset)
 * 🎯 Board Interactions (column attempts)
 * 💬 Cha      // Going backwards - undo moves from current to target
      for (let i = fromIndex; i > toIndex; i--) {
        const move = moves[i - 1] // Get previous move
        const game = gameHistory.game
        const row = game?.getAvailableRow(move) ?? 0 // Already points to the correct row to remove from
        const player = (i - 1) % 2 // Player alternates each move
        unifiedLayoutRef.current.undoMoveAnimation(row, move, player)
      }
    } else {
      // Going forwards - replay moves from current to target
      for (let i = Math.max(1, fromIndex + 1); i <= toIndex; i++) {
        const game = gameHistory.gamesend/receive)
 * 📖 Move History (navigation, clicks)
 * 🏳️ Game Actions (resign, draw)
 * 🔬 Analysis Controls (toggle, settings)
 * ⏱️ Timer Changes
 * 📊 Score Changes
 * 🔌 WebSocket Events (connect/disconnect)
 * 📤📨 WebSocket Messages (send/receive)
 */

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import LiveGameWithAnalysis, { LiveGameRef } from "@/components/game/full-sides/LiveGameUI"
import { ChatMessage, JoinMetadata, StandardGameMove, StandardSpectatingMetadata } from "@shared/types/Websocket"
import useSound from "@/utils/useSound"
import { useSocketContext } from "@/components/providers/SocketProvider"
import { useGameSession, useUser } from "@/components/providers/BackendProvider"
import { StandardGameMetadata } from "@shared/types/Websocket"
import { PlayerData } from "@shared/types/users"
import { GameState } from "@shared/constants/allgamestates"
import { GameEndModal } from "@/components/game/game-end-popup"
import { GameStartModal } from "@/components/game/game-start-popup"
import { useWASM } from "@/components/providers/WASMProvider"
import { EloChange, GameInfo, TimeControl } from "@shared/types/game.types"
import { TimedStandardGame } from "@shared/utils/Games/timed-game"
import { CategoriseTime, printGameMode, printTimeControl } from "@shared/utils/gamemodes"

export default function LiveGamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 🆕 USE GAME SESSION PROVIDER
  const { joinGame, leaveGame, isInGame, currentShortcode } = useGameSession()
  
  // Use the existing SocketIO hook (ONLY for message handling now)
  const { sendJson, connected, onPrefixedMessage, unsubscribePrefixedMessage } = useSocketContext()
  
  // Get user context for fallback player data
  const { user } = useUser()

  // WASM control for analysis
  const { isActive: isWASMActive, activateWASM, deactivateWASM } = useWASM()

  // Refs for server-driven data (do not cause renders on their own)
  const meRef = useRef<PlayerData>()
  const opponentRef = useRef<PlayerData>()
  const currentTurnRef = useRef(-1)
  const isRedRef = useRef(false)
  const lMoveRef = useRef(0)
  const pTimesRef = useRef<[number, number]>([0, 0])
  const isGameRunningRef = useRef(false)
  const eloChangesRef = useRef<EloChange | null>(null)

  const myGame = useRef<TimedStandardGame | null>(null)
  const gameInfoRef = useRef<GameInfo | null>(null)

  // UI + rendering version signals (simplified)
  const [gameVersion, setGameVersion] = useState(0)
  const [boardKey, setBoardKey] = useState("board-0") // For forcing board re-renders

  // Board animation control
  const liveGameRef = useRef<LiveGameRef>(null)
  const unifiedLayoutRef = useRef<any>(null) // Reference to the unified layout for board control
  
  // Disconnect state tracking
  const player1DisconnectedRef = useRef(false)
  const player2DisconnectedRef = useRef(false)
  const [animateInit, setAnimateInit] = useState(false)
  
  // Dynamic header state for better flexibility
  const [dynamicHeader, setDynamicHeader] = useState<string>("Game Starting...")
  
  // Calculate dynamic title based on game state
  const setStandardTitle = () => {
    let head;
    if (!isGameRunningRef.current) head = "Game Paused"
    if (isSpectating) head = "Spectating"

    const isMyTurn = currentTurnRef.current === (isRedRef.current ? 0 : 1)
    head = isMyTurn ? "Your Turn!" : "Waiting..."
    setDynamicHeader(head);
  }

  // Mark board as ready 
  const handleBoardReady = () => {
    console.log("🔄 BOARD: Board is ready")
  }

  // Initial meRef from user context
  useEffect(() => {
    if (user && !meRef.current) {
      meRef.current = {
        username: user.username,
        pfp: user.pfp || '/icons/user.svg',
        time: 300000,
        elo: undefined,
      }
      // Trigger UI refresh (header/timers that read from refs)
      setGameVersion((v) => v + 1)
    }
  }, [user])

  const [scoreRatio, setScoreRatio] = useState(0.5)
  const [showAnalysis, setShowAnalysis] = useState(false)
  
  // Game Start / End state
  const [showStartPopup, setShowStartPopup] = useState(false)
  const [gameMode, setGameMode] = useState("Loading...")
  const [timeControl, setTimeControl] = useState("...")
  const [gameUrl, setGameUrl] = useState("")
  const [isP2Bot, setIsP2Bot] = useState(false) // Track if opponent is a bot

  const [showEndPopup, setShowEndPopup] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isSpectating, setIsSpectating] = useState(false)

  // Determine when WASM should be active for analysis
  // Only when: game is over OR not running, AND (bot mode OR spectating), AND we have game data
  const shouldActivateWASM = 
    (!isGameRunningRef.current || myGame.current?.gameOver) && 
    (isP2Bot || isSpectating) &&
    gameInfoRef.current !== null

  // Draw offer state tracking
  const [drawOfferedBy, setDrawOfferedBy] = useState<number | null>(null) // null, 0, or 1 for which player offered draw

  // Update dynamic header when game state changes
  useEffect(() => {
    setStandardTitle()
  }, [isGameRunningRef.current, isSpectating, currentTurnRef.current, isRedRef.current, gameVersion])

  // Handle WASM activation based on conditions
  useEffect(() => {
    if (shouldActivateWASM && !isWASMActive) {
      activateWASM()
      console.log("🔬 WASM: Auto-activated for analysis")
    } else if (!shouldActivateWASM && isWASMActive) {
      deactivateWASM()
      console.log("🔬 WASM: Auto-deactivated")
    }
  }, [shouldActivateWASM, isWASMActive, activateWASM, deactivateWASM])

  const [startSFX] = [useSound("/sounds/start.mp3")]

  // Chat and Move History initial messages
  const [chatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      username: "System",
      message: "Waiting for game to start!",
      type: "system",
      color: "white",
      timestamp: new Date(Date.now() - 60000),
    }
  ])

  // Step 1: Register ALL socket handlers immediately on mount
  useEffect(() => {
    console.log("🔌 WEBSOCKET: Registering event handlers immediately")
    
    onPrefixedMessage("matchmaking", (event, data) => {
      console.log("📨 WEBSOCKET: Received matchmaking event:", event, "with data:", data)
      switch (event) {
        case "failed":
          console.warn("📨 WEBSOCKET: Failed to join matchmaking")
          setShowStartPopup(false)
          router.push("/play/setup")
          break
        case "joined":
          console.log("📨 WEBSOCKET: Successfully joined matchmaking with data:", JSON.stringify(data))
          const { shortcode, gameinfo, isSpectating, isP2Bot } = data as JoinMetadata
          const gi = gameinfo as GameInfo;
          gameInfoRef.current = gi; // Store GameInfo for later use
          if (shortcode && currentShortcode && currentShortcode !== shortcode) {
            console.error("Shortcode mismatch in matchmaking data", currentShortcode, shortcode)
            return
          }
          setGameMode(printGameMode(gi) || "Custom")
          setIsSpectating(isSpectating)
          setIsP2Bot(isP2Bot) // Enable bot state tracking
          console.log("🤖 BOT MODE:", isP2Bot ? "ENABLED" : "DISABLED")
          setTimeControl(printTimeControl(gi.time_control))
          console.log("🔬 WASM: Analysis conditions updated")
          break
        default:
          console.warn(`📨 WEBSOCKET: Unhandled matchmaking event ${event} with data:`, data)
      }
    })

    onPrefixedMessage("game", (event, data) => {
      switch (event) {
        case "setup": {
          const setupData = data as StandardGameMetadata

          // Show (or re-show) the start popup, then close shortly after showing match found
          setShowStartPopup(true)
          setTimeout(() => {
            setShowStartPopup(false)
            console.log("🎮 MATCHMAKING: Closed start popup after showing match found")
          }, 3000)

          // play start sound

          // Populate refs from server
          meRef.current = {
            username: setupData.me.username,
            pfp: setupData.me.pfp || meRef.current?.pfp || '/icons/user.svg',
            time: setupData.me.time,
            elo: setupData.me.elo,
          }
          opponentRef.current = setupData.opponent
          isRedRef.current = setupData.iRed
          lMoveRef.current = setupData.lTime
          pTimesRef.current = setupData.rTimes
          currentTurnRef.current = setupData.turn
          isGameRunningRef.current = true
          eloChangesRef.current = setupData.eloChanges

          // Create/replace game model
          if (!gameInfoRef.current) {
            console.error("No GameInfo available for TimedStandardGame creation");
            return;
          }
          myGame.current = new TimedStandardGame(gameInfoRef.current)
          if (setupData.moves && setupData.moves.length > 0) {
            myGame.current.loadMoves(setupData.moves, [])
          }

          // Enable initial replay when entering from setup
          setAnimateInit(true)

          // Bump versions so UI reads the new model and timers
          setGameVersion((v) => v + 1)
          setBoardKey(`board-setup-${Date.now()}`) // Force board re-render
          break
        }
        case "spectate": {
          const setupData = data as StandardSpectatingMetadata
          setIsSpectating(true)

          lMoveRef.current = setupData.lTime
          pTimesRef.current = setupData.rTimes
          currentTurnRef.current = setupData.turn
          isGameRunningRef.current = true

          if (setupData.moves) {
            // For spectating, create a basic GameInfo with reasonable defaults
            const spectateGameInfo: GameInfo = {
              gamemode: setupData.gamemode,
              time_control: {
                base_time: 300, // 5 minutes default
                increment: 0,
                disadvantage: 0
              }
            };
            myGame.current = new TimedStandardGame(spectateGameInfo)
            myGame.current.loadMoves(setupData.moves, [])
            console.log(`🎮 SPECTATE: Set up game with ${setupData.moves.length} existing moves`)
            // Replay for spectators on initial mount
            setAnimateInit(setupData.moves.length > 0)
            setGameVersion((v) => v + 1)
            setBoardKey(`board-spectate-${Date.now()}`)
          }
          break
        }
        case "chat": {
          const validatedMessage = data as ChatMessage

          // I'm lazy so there won't be a separate spectator channel for now
          if (!isSpectating && validatedMessage.type === 'spectator') {
            return;
          }

          if (liveGameRef.current) {
            liveGameRef.current.addChatMessage(
              validatedMessage.message,
              validatedMessage.username,
              validatedMessage.type,
              validatedMessage.color,
            )
          } else {
            console.error("❌ CHAT: LiveGameRef not available to add message")
          }
          break
        }
        case "move": {
          const moveData = data as StandardGameMove
          console.log("📨 WEBSOCKET: Received move data:", JSON.stringify(moveData))

          // Clear draw offers when a move is made (backend cancels them)
          if (drawOfferedBy !== null) {
            setDrawOfferedBy(null)
            liveGameRef.current?.addSystemMessage("Draw offer cancelled by move")
          }

          // Animate on board immediately
          if (unifiedLayoutRef.current) {
            unifiedLayoutRef.current.triggerMoveAnimation(moveData.row, moveData.col, moveData.player)
          }
          
          // Commit to model immediately and sync UI
          try { 
            if (myGame.current) {
              myGame.current.makeMove(moveData.col)
            }
            // Ensure we're viewing the latest move
          } catch (e) { 
            console.error("❌ GAME: Failed to commit move", moveData.col, e) 
          }

          // Update timing and turn instantly
          lMoveRef.current = moveData.lMove
          pTimesRef.current = moveData.rTimes
          currentTurnRef.current = 1 - moveData.player
          isGameRunningRef.current = true
          
          setGameVersion(v => v + 1)
          break
        }
        case "over": {
          isGameRunningRef.current = false
          setShowStartPopup(false)
          const { result } = data
          setGameState(result)
          setShowEndPopup(true)
          setDynamicHeader("Game Over")
          
          // Clear draw offers when game ends
          setDrawOfferedBy(null)
          
          // Add appropriate chat message for draw
          if (result === GameState.AGREED_DRAW) {
            liveGameRef.current?.addSystemMessage("Draw agreed!")
          }
          
          console.log("🏁 GAME: Game has ended", { result })
          // Ensure timers stop and UI updates
          setGameVersion((v) => v + 1)
          break
        }
        case "disconnection": {
          const { player } = data
          console.log("🏁 GAME: Player has disconnected", { player })
          
          // Track which player disconnected
          if (player === 0) {
            player1DisconnectedRef.current = true
          } else if (player === 1) {
            player2DisconnectedRef.current = true
          }
          
          setGameVersion((v) => v + 1)
          break
        }
        case "reconnection": {
          const { player } = data
          console.log("🔌 GAME: Player has reconnected", { player })
          
          // Reset disconnect state for reconnected player
          if (player === 0) {
            player1DisconnectedRef.current = false
          } else if (player === 1) {
            player2DisconnectedRef.current = false
          }
          
          // Reset header if opponent reconnected
          if (!isSpectating) {
            const isOpponentReconnected = (
              (isRedRef.current && player === 1) || // I'm red, yellow reconnected
              (!isRedRef.current && player === 0)   // I'm yellow, red reconnected
            )
            
            if (isOpponentReconnected) {
              setStandardTitle() // Reset to normal title
              liveGameRef.current?.addSystemMessage("Opponent Reconnected!")
            }
          }
          
          setGameVersion((v) => v + 1)
          break
        }
        case "disconnect": {
          const { player } = data
          
          // Set disconnection state based on player position and spectator status
          if (isSpectating) {
            // For spectators: player 0 is top position (player1 in layout)
            if (player === 0) {
              player1DisconnectedRef.current = true
            } else if (player === 1) {
              player2DisconnectedRef.current = true
            }
          } else {
            // For players: map game player indices to UI positions
            // If I'm red (player 0), opponent is yellow (player 1) and vice versa
            const isOpponentDisconnected = (
              (isRedRef.current && player === 1) || // I'm red, yellow disconnected
              (!isRedRef.current && player === 0)   // I'm yellow, red disconnected
            )
            
            if (isOpponentDisconnected) {
              // Opponent disconnected - they are in player1 position (top)
              player1DisconnectedRef.current = true
              
              // Send chat alert and update header
              liveGameRef.current?.addSystemMessage("Opponent Disconnected...")
              setDynamicHeader("Opponent Disconnected...")
            } else {
              // This shouldn't happen - we got disconnect event for ourselves
              console.error("❌ GAME: Received disconnect event for myself", { player, isRed: isRedRef.current })
            }
          }

          setGameVersion((v) => v + 1)
          break
        }
        case "reconnect": {
          const { player } = data
          
          // Set disconnection state based on player position and spectator status
          if (isSpectating) {
            // For spectators: player 0 is top position (player1 in layout)
            if (player === 0) {
              player1DisconnectedRef.current = false
            } else if (player === 1) {
              player2DisconnectedRef.current = false
            }
          } else {
            // For players: map game player indices to UI positions
            // If I'm red (player 0), opponent is yellow (player 1) and vice versa
            const isOpponentReconnected = (
              (isRedRef.current && player === 1) || // I'm red, yellow reconnected
              (!isRedRef.current && player === 0)   // I'm yellow, red reconnected
            )
            
            if (isOpponentReconnected) {
              // Opponent reconnected - they are in player1 position (top)
              player1DisconnectedRef.current = false
              
              // Send chat alert and update header
              liveGameRef.current?.addSystemMessage("Opponent Disconnected...")
              setStandardTitle();
            } else {
              // This shouldn't happen - we got disconnect event for ourselves
              console.error("❌ GAME: Received disconnect event for myself", { player, isRed: isRedRef.current })
            }
          }

          setGameVersion((v) => v + 1)
          break
        }
        case "draw": {
          const { player } = data
          console.log("🤝 GAME: Draw offered by player", player)
          
          // Track who offered the draw
          setDrawOfferedBy(player)
          
          // Add chat message about draw offer
          const isMyOffer = player === (isRedRef.current ? 0 : 1)
          const playerName = isMyOffer ? "You" : (opponentRef.current?.username || "Opponent")
          liveGameRef.current?.addSystemMessage(`${playerName} offered a draw`)
          
          break
        }
        default:
          console.warn(`📨 WEBSOCKET: Unhandled event ${event} with data:`, data)
          break
      }
    })
  }, [])

  // 🆕 SIMPLIFIED: Handle URL parameter and join game
  useEffect(() => {
    const roomParam = searchParams.get('r')
    
    if (!roomParam || roomParam.trim() === "") {
      console.log("🔌 REDIRECT: Empty or missing ?r parameter, redirecting to /play/setup")
      router.push("/play/setup")
      return
    }
    
    // Use the provider to join the game
    joinGame(roomParam)
    setGameUrl(`${window.location.origin}/game?r=${roomParam}`)
    setShowStartPopup(true)
    
    console.log("🔌 GAME SESSION: Joined game via provider:", roomParam)
  }, [searchParams, router, joinGame])

  // 🚫 REMOVED: Let provider handle navigation cleanup and show return popup
  // Don't call leaveGame() on unmount - let the provider decide whether to show popup

  // Board animation control
  const handleResetGame = () => {
    console.log("🔄 RESET GAME clicked")
    setScoreRatio(0.5)
    isGameRunningRef.current = false
    
    // Reset bot state
    setIsP2Bot(false)
    
    // Reset WASM state
    deactivateWASM()
    
    // Reset the game instance
    if (myGame.current) {
      myGame.current.reset()
      console.log("🎮 GAME: Reset game instance")
    }

    // Reset meRef to fallback user context data
    if (user) {
      meRef.current = {
        username: user.username,
        pfp: user.pfp || '/icons/user.svg',
        time: 300000,
        elo: undefined,
      }
    } else {
      meRef.current = undefined
    }
    opponentRef.current = undefined

    // Disable initial replay after reset
    setAnimateInit(false)

    // Bump versions so UI resets
    setGameVersion((v) => v + 1)
  }

  const handleColumnAttempt = (col: number) => {
    console.log(`🎯 COLUMN ATTEMPT: Player attempted move in column ${col}`)
    if (isSpectating) {
      console.log("👁️ SPECTATING: Player is spectating, move not sent")
      return
    }
    if (connected) {
      sendJson("game:move", { 
        shortcode: currentShortcode, 
        move: col,
      })
      console.log("📤 WEBSOCKET: Sending move to server:", col)
    } else {
      console.log("📤 WEBSOCKET: Not connected, move not sent:")
    }
  }

  // Chat Event Handlers
  const handleMessageSent = (message: ChatMessage) => {
    if (isSpectating) {
      console.log("👁️ SPECTATING: Player is spectating, TODO: spectator only chat")
      return
    }
    if (connected) {
      sendJson("game:chat", { shortcode: currentShortcode, message: message.message })
    } else {
      console.log("📤 WEBSOCKET: Not connected, message not sent:", message.message)
    }
  }

  // Move History Event Handlers (go to move)
  const bumpGame = () => setGameVersion((v) => v + 1)

  // Helper to calculate which moves need undo/redo animations
  const animateMoveTransition = (fromIndex: number, toIndex: number) => {
    if (!myGame.current || !unifiedLayoutRef.current) return
    
    const moves = myGame.current.getMoves()

    if (fromIndex > toIndex) {
      // Going backwards - undo moves from current to target
      for (let i = fromIndex; i > toIndex; i--) {
        const move = moves[i - 1] // Get previous move
        const row = myGame.current.getAvailableRow(move) // Already points to the correct row to remove from
        const player = (i - 1) % 2 // Player alternates each move
        unifiedLayoutRef.current.undoMoveAnimation(row, move, player)
      }
    } else {
      // Going forwards - replay moves from current to target
      for (let i = Math.max(1, fromIndex + 1); i <= toIndex; i++) {
        const move = moves[i - 1]
        const row = myGame.current.getAvailableRow(move)
        const player = (i - 1) % 2
        unifiedLayoutRef.current.triggerMoveAnimation(row, move, player)
      }
    }
  }

  const handleMoveClick = (moveIndex: number) => {
    console.log(`📖 MOVE CLICKED: Move ${moveIndex}`)
    bumpGame()
  }

  const handleFirstMove = () => {
    console.log("⏮️ FIRST MOVE clicked")
    bumpGame()
  }

  const handlePreviousMove = () => {
    console.log("⏪ PREVIOUS MOVE clicked")
    bumpGame()
    
  }

  const handleNextMove = () => {
    console.log("⏩ NEXT MOVE clicked")
    bumpGame()
  }

  const handleLastMove = () => {
    console.log("⏭️ LAST MOVE clicked")
    bumpGame()
  }

  // Game Control Event Handlers
  const handleResign = () => {
    console.log("🏳️ RESIGN clicked")
    sendJson("game:resign", { shortcode: currentShortcode })
  }

  const handleOfferDraw = () => {
    console.log("🤝 OFFER DRAW clicked")
    // check the draw status first
    sendJson("game:draw_offer", { shortcode: currentShortcode })
  }

  // Bot-specific Event Handlers
  const handleHint = () => {
    console.log("🤖 HINT requested")
    // TODO: Implement bot hint logic
    // For now, just log the request
  }

  // Analysis Event Handlers
  const handleToggleAnalysis = (enabled: boolean) => {
    if (isGameRunningRef.current) {
      console.error("no analysis during game")
      return
    }
    console.log(`🔬 ANALYSIS TOGGLED: ${enabled ? 'ON' : 'OFF'}`)
  }

  const handleSettingsClick = () => {
    console.log("⚙️ SETTINGS clicked")
  }

  const handleCancelMatchmaking = () => {
    console.log("🎮 START POPUP: Closing")
    if (isGameRunningRef.current) {
      setShowStartPopup(false)
      return
    }
    if (connected && currentShortcode) {
      sendJson("matchmaking:leave", { shortcode: currentShortcode })
      console.log("📤 WEBSOCKET: Sent leave matchmaking")
    }
    router.push("/play/setup")
  }

  // Game End Modal Handlers
  const handleCloseEndPopup = () => {
    console.log("🏁 END POPUP: Closed")
    setShowEndPopup(false)
  }

  const handleReviewGame = () => {
    console.log("📊 REVIEW GAME clicked")
    setShowEndPopup(false)
  }

  const handleNewGame = () => {
    console.log("🆕 NEW GAME clicked") 
    setShowEndPopup(false)
    router.push("/play/setup")
  }

  const handleRematch = () => {
    console.log("🔄 REMATCH clicked")
    setShowEndPopup(false)
  }

  const handleTimeUp = () => {
    console.log("⏰ GAME: Time ran out")
    if (connected) {
      // first add a 0.1s delay to ensure the UI updates
      setTimeout(() => {
        sendJson("game:enquire", { shortcode: currentShortcode })
        console.log("📤 WEBSOCKET: Sent timeup event for shortcode:", currentShortcode)
      }, 100)
    }
  }


  return (
    <>
    <UnifiedGameLayout
      ref={unifiedLayoutRef}
      board={{
        interactive: true,
        animate_init: animateInit,
        onColumnAttempt: handleColumnAttempt,
        ariaLabel: "Live Connect 4 game board",
        boardState: myGame.current?.getBoard() || Array(6).fill(null).map(() => Array(7).fill(null)),
        gameOver: myGame.current?.gameOver || false,
        key: boardKey,
      }}
      gameState={{
        scoreRatioRef: { current: scoreRatio },
        isGameRunningRef: isGameRunningRef,
        // Position players correctly: current user at bottom (player2), opponent at top (player1)
        player1: opponentRef, // Top position
        player2: meRef,       // Bottom position  
        player1Time: pTimesRef.current[isRedRef.current ? 1 : 0], // Opponent's time
        player2Time: pTimesRef.current[isRedRef.current ? 0 : 1], // My time
        currentTurn: currentTurnRef,
        lastMoveTimestamp: lMoveRef, // Pass the last move timestamp ref
        player1IsRed: !isRedRef.current, // Opponent's color (opposite of mine)
        player1DisconnectedRef: player2DisconnectedRef, // Opponent disconnect status
        player2DisconnectedRef: player1DisconnectedRef, // My disconnect status (though I shouldn't be disconnected)
      }}
      layout={{
        showScoreBar: true,
        showTimers: true,
        showPlayerInfo: true,
        headerText: dynamicHeader, // Use dynamic header state
      }}
      onBoardReady={handleBoardReady}
      onTimeUp={handleTimeUp}
    >
      {/* Unified UI that conditionally shows bot or chat based on isP2Bot */}
      <LiveGameWithAnalysis 
        key={isP2Bot ? "unique-botgame-instance" : "unique-livegame-instance"}
        ref={liveGameRef}
        initialChatMessages={chatMessages}
        game={myGame.current || undefined}
        meRef={meRef}
        opponentRef={opponentRef}
        currentMoveIndex={2}
        onMessageSent={handleMessageSent}
        onMoveClick={handleMoveClick}
        onFirstMove={handleFirstMove}
        onPreviousMove={handlePreviousMove}
        onNextMove={handleNextMove}
        onLastMove={handleLastMove}
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        onHint={handleHint}
        onToggleAnalysis={handleToggleAnalysis}
        onSettingsClick={handleSettingsClick}
        showAnalysisFeatures={showAnalysis}
        isBotMode={isP2Bot}
        drawOfferedBy={drawOfferedBy}
        isRedPlayer={isRedRef.current}
        highlightOfferDraw={false}
      />
    </UnifiedGameLayout>

    <GameEndModal
      isOpen={showEndPopup}
      onClose={handleCloseEndPopup}
      state={gameState || GameState.ERRORED}
      meRef={meRef}
      isRedRef={isRedRef}
      eloChangesRef={eloChangesRef}
      mistakes={0}
      blunders={0}
      greatMoves={0}
      onReviewGame={handleReviewGame}
      onNewGame={handleNewGame}
      onRematch={handleRematch}
    />

    <GameStartModal
      open={showStartPopup}
      gameMode={gameMode}
      timeControl={timeControl}
      gameUrl={gameUrl}
      onCancel={handleCancelMatchmaking}
      meRef={meRef}
      opponentRef={opponentRef}
      // Re-render modal when we update refs
      forceUpdateTrigger={gameVersion}
    />
    </>
  )
}
