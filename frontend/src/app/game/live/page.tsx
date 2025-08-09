'use client'
/*
 * LiveGame Test Page with WebSocket Integration Points
 * 
 * This page demonstrates how to integrate WebSocket functionality with the LiveGameUI component.
 * All user interactions are logged to console for debugging and de      <LiveGameWithAnalysis 
        ref={liveGameRef}
        initialChatMessages={chatMessages}
        moves={moves}
        currentUser="You"
        onMessageSent={handleMessageSent}
        onMoveClick={handleMoveClick}
        onFirstMove={handleFirstMove}
        onPreviousMove={handlePreviousMove}
        onNextMove={handleNextMove}
        onLastMove={handleLastMove}
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        onToggleAnalysis={handleToggleAnalysis}
        onSettingsClick={handleSettingsClick}
        showAnalysisFeatures={showAnalysis}
      />
 * WebSocket Integration Points:
 * - handleSendMessage: Send chat messages to server
 * - handleColumnAttempt: Send moves to server
 * - useEffect: Simulate receiving messages/moves from server
 * 
 * Console Log Categories:
 * 🎮 Game Controls (start, pause, reset)
 * 🎯 Board Interactions (column attempts)
 * 💬 Chat Messages (send/receive)
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
import { GameBoardLayout } from "@/components/layouts/game-board-layout"
import { BoardHandle } from "@/components/boards/Board"
import LiveGameWithAnalysis, { LiveGameRef } from "@/components/game/LiveGameUI"
import { ChatMessage, StandardGameMove, StandardSpectatingMetadata } from "@shared/types/Websocket"
import useSound from "@/utils/useSound"
import { useSocketContext } from "@/components/providers/SocketProvider"
import { useUser } from "@/components/providers/userProvider"
import { StandardGameMetadata } from "@shared/types/Websocket"
import { PlayerData } from "@shared/types/users"
import { GameState } from "@shared/constants/allgamestates"
import { GameEndModal } from "@/components/game/game-end-popup"
import { GameStartModal } from "@/components/game/game-start-popup"
import { EloChange } from "@shared/types/game"
import { StandardGame } from "@shared/utils/Games/game"

export default function LiveGamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Extract shortcode from URL parameter ?r=SHORTCODE
  const [shortcode, setShortcode] = useState<string>("")
  
  // Use the existing SocketIO hook
  const { sendJson, connected, onPrefixedMessage } = useSocketContext()
  
  // Get user context for fallback player data
  const { user } = useUser()

  // Refs for server-driven data (do not cause renders on their own)
  const meRef = useRef<PlayerData>()
  const opponentRef = useRef<PlayerData>()
  const currentTurnRef = useRef(-1)
  const isRedRef = useRef(false)
  const lMoveRef = useRef(0)
  const pTimesRef = useRef<[number, number]>([0, 0])
  const isGameRunningRef = useRef(false)
  const eloChangesRef = useRef<EloChange | null>(null)
  const myGame = useRef(new StandardGame())

  // UI + rendering version signals
  // - gameVersion: bump when game model state changes (moves/index)
  // - timeVersion: bump when timing/turn/lastMove changes
  const [gameVersion, setGameVersion] = useState(0)
  const [timeVersion, setTimeVersion] = useState(0)
  // - positionVersion: bump only when we want to remount the Board with a new static position (e.g., go-to-move/reset)
  const [positionVersion, setPositionVersion] = useState(0)

  // Board animation control
  const liveGameRef = useRef<LiveGameRef>(null)
  const gameBoardRef = useRef<BoardHandle>(null)
  const [animateInit, setAnimateInit] = useState(false) // replay existing moves on first paint
  const replayPosVersionRef = useRef<number | null>(null)

  // Mark board as ready (prevent replay repeats)
  const handleBoardReady = () => {
    // Keep animateInit until after initial remounts; gated by positionVersion
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
  const [gameMode, setGameMode] = useState("Standard")
  const [timeControl, setTimeControl] = useState("5+3")
  const [gameUrl, setGameUrl] = useState("")

  const [showEndPopup, setShowEndPopup] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isSpectating, setIsSpectating] = useState(false)

  const [startSFX] = [useSound("/sounds/start.mp3")]

  // Chat and Move History initial messages
  const [chatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      username: "System",
      message: "Game started!",
      type: "system",
      color: "white",
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "2",
      username: "Opponent",
      message: "Good luck!",
      type: "user",
      color: "red",
      timestamp: new Date(Date.now() - 30000),
    },
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
          if (data.shortcode && shortcode && shortcode !== data.shortcode) {
            console.error("Shortcode mismatch in matchmaking data", shortcode, data.shortcode)
            return
          }
          setGameMode("TEST GAMEMODE")
          break
        default:
          console.warn(`📨 WEBSOCKET: Unhandled matchmaking event ${event} with data:`, data)
      }
    })

    onPrefixedMessage("game", (event, data) => {
      console.log("📨 WEBSOCKET: Received game event:", event, "with data:", data)
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
          myGame.current = new StandardGame(setupData.moves || [])

          // Enable initial replay when entering from setup
          setAnimateInit(true)

          // Bump versions so UI reads the new model and timers
          setGameVersion((v) => v + 1)
          setTimeVersion((v) => v + 1)
          setPositionVersion((prev) => {
            const next = prev + 1
            replayPosVersionRef.current = next
            return next
          }) // new position
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
            myGame.current = new StandardGame(setupData.moves)
            console.log(`🎮 SPECTATE: Set up game with ${setupData.moves.length} existing moves`)
            // Replay for spectators on initial mount
            setAnimateInit(setupData.moves.length > 0)
            setGameVersion((v) => v + 1)
            setTimeVersion((v) => v + 1)
            setPositionVersion((prev) => {
              const next = prev + 1
              replayPosVersionRef.current = next
              return next
            })
          }
          break
        }
        case "chat": {
          const validatedMessage = data as ChatMessage
          if (liveGameRef.current) {
            liveGameRef.current.addChatMessage(
              validatedMessage.message,
              validatedMessage.username,
              validatedMessage.type,
              validatedMessage.color,
            )
            console.log("✅ CHAT: Added validated message via ref")
          } else {
            console.error("❌ CHAT: LiveGameRef not available to add message")
          }
          break
        }
        case "move": {
          const moveData = data as StandardGameMove
          console.log("📨 WEBSOCKET: Received move data:", JSON.stringify(moveData))

          // Animate on board immediately
          if (gameBoardRef.current) {
            // If we're not at the last move, animate back to current first
            const currentIndex = myGame.current.currentMoveIndex
            const moves = myGame.current.getMoves()
            if (currentIndex < moves.length - 1) {
              // Animate from current position to latest before showing new move
              animateMoveTransition(currentIndex + 1, moves.length)
            }
            gameBoardRef.current.triggerMoveAnimation(moveData.row, moveData.col, moveData.player)
          }

          // Commit to model immediately and sync UI
          try { 
            myGame.current.makeMove(moveData.col)
            // Ensure we're viewing the latest move
            myGame.current.setMoveIndex(myGame.current.getMoves().length - 1)
          } catch (e) { 
            console.error("❌ GAME: Failed to commit move", moveData.col, e) 
          }

          // Update timing and turn instantly
          lMoveRef.current = moveData.lMove
          pTimesRef.current = moveData.rTimes
          currentTurnRef.current = 1 - moveData.player
          isGameRunningRef.current = true

          setGameVersion(v => v + 1)
          setTimeVersion(v => v + 1)
          break
        }
        case "over": {
          isGameRunningRef.current = false
          setShowStartPopup(false)
          const { result } = data
          setGameState(result)
          setShowEndPopup(true)
          console.log("🏁 GAME: Game has ended", { result })
          // Ensure timers stop and UI updates
          setTimeVersion((v) => v + 1)
          setGameVersion((v) => v + 1)
          break
        }
        case "disconnection": {
          console.log("🏁 GAME: Player has disconnected")
          break
        }
        default:
          console.warn(`📨 WEBSOCKET: Unhandled event ${event} with data:`, data)
          break
      }
    })
  }, [])

  // Step 2: Handle URL parameter and join matchmaking
  useEffect(() => {
    const roomParam = searchParams.get('r')
    
    if (!roomParam || roomParam.trim() === "") {
      console.log("🔌 REDIRECT: Empty or missing ?r parameter, redirecting to /play/setup")
      router.push("/play/setup")
      return
    }
    
    setShortcode(roomParam)
    setGameUrl(`${window.location.origin}/game/live?r=${roomParam}`)
    console.log("🔌 SHORTCODE: Extracted from URL parameter ?r=", roomParam)
    
    // Show start popup when page loads
    setShowStartPopup(true)

    // Store the roomParam for when we connect
    setShortcode(roomParam)
  }, [searchParams, router, connected, sendJson])

  // Join matchmaking when connected and we have a shortcode
  useEffect(() => {
    if (connected && shortcode) {
      sendJson("matchmaking:join", { shortcode })
      console.log("📤 WEBSOCKET: Sent join matchmaking with shortcode:", shortcode)
    }
  }, [connected, shortcode, sendJson])

  // Send a leave message if the page is being closed (best-effort)
  useEffect(() => {
    let sentLeave = false

    const handleCloseSocket = () => {
      if (connected && !sentLeave) {
        sendJson("game:leave", { })
        sentLeave = true
      }
    }

    window.addEventListener('pagehide', handleCloseSocket)
    window.addEventListener('beforeunload', handleCloseSocket)

    return () => {
      window.removeEventListener('pagehide', handleCloseSocket)
      window.removeEventListener('beforeunload', handleCloseSocket)
    }
  }, [connected, sendJson])

  // Board animation control
  const handleResetGame = () => {
    console.log("🔄 RESET GAME clicked")
    setScoreRatio(0.5)
    isGameRunningRef.current = false
    
    // Reset the game instance
    myGame.current.reset()
    console.log("🎮 GAME: Reset game instance")

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
    setTimeVersion((v) => v + 1)
    setPositionVersion((v) => v + 1)
  }

  const handleColumnAttempt = (col: number) => {
    console.log(`🎯 COLUMN ATTEMPT: Player attempted move in column ${col}`)
    if (isSpectating) {
      console.log("👁️ SPECTATING: Player is spectating, move not sent")
      return
    }
    if (connected) {
      sendJson("game:move", { 
        shortcode, 
        move: col,
      })
      console.log("📤 WEBSOCKET: Sending move to server:", col)
    } else {
      console.log("📤 WEBSOCKET: Not connected, move not sent:")
    }
  }

  // Chat Event Handlers
  const handleMessageSent = (message: ChatMessage) => {
    console.log(`💬 MESSAGE SENT:`, message)
    if (isSpectating) {
      console.log("👁️ SPECTATING: Player is spectating, TODO: spectator only chat")
      return
    }
    if (connected) {
      sendJson("game:chat", { shortcode, message: message.message })
      console.log("📤 WEBSOCKET: Sending message to server:", message.message)
    } else {
      console.log("📤 WEBSOCKET: Not connected, message not sent:", message.message)
    }
  }

  // Move History Event Handlers (go to move)
  const bumpGame = () => setGameVersion((v) => v + 1)

  // Helper to calculate which moves need undo/redo animations
  const animateMoveTransition = (fromIndex: number, toIndex: number) => {
    const moves = myGame.current.getMoves()
    if (!gameBoardRef.current) return

    if (fromIndex > toIndex) {
      // Going backwards - undo moves from current to target
      for (let i = fromIndex; i > toIndex; i--) {
        const move = moves[i - 1] // Get previous move
        const row = myGame.current.getAvailableRow(move) // Already points to the correct row to remove from
        const player = (i - 1) % 2 // Player alternates each move
        gameBoardRef.current.undoMoveAnimation(row, move, player)
      }
    } else {
      // Going forwards - replay moves from current to target
      for (let i = Math.max(1, fromIndex + 1); i <= toIndex; i++) {
        const move = moves[i - 1]
        const row = myGame.current.getAvailableRow(move)
        const player = (i - 1) % 2
        gameBoardRef.current.triggerMoveAnimation(row, move, player)
      }
    }
  }

  const handleMoveClick = (moveIndex: number) => {
    console.log(`📖 MOVE CLICKED: Move ${moveIndex}`)
    const currentIndex = myGame.current.currentMoveIndex
    animateMoveTransition(currentIndex + 1, moveIndex)
    myGame.current.setMoveIndex(moveIndex - 1) // -1 because index is 0-based
    bumpGame()
  }

  const handleFirstMove = () => {
    console.log("⏮️ FIRST MOVE clicked")
    const currentIndex = myGame.current.currentMoveIndex
    animateMoveTransition(currentIndex + 1, 0)
    myGame.current.setMoveIndex(-1)
    bumpGame()
  }

  const handlePreviousMove = () => {
    console.log("⏪ PREVIOUS MOVE clicked")
    const currentIndex = myGame.current.currentMoveIndex
    if (currentIndex >= 0) {
      animateMoveTransition(currentIndex + 1, currentIndex)
      myGame.current.adjMoveIndex(-1)
      bumpGame()
    }
  }

  const handleNextMove = () => {
    console.log("⏩ NEXT MOVE clicked")
    const currentIndex = myGame.current.currentMoveIndex
    const moves = myGame.current.getMoves()
    if (currentIndex < moves.length - 1) {
      animateMoveTransition(currentIndex + 1, currentIndex + 2)
      myGame.current.adjMoveIndex(1)
      bumpGame()
    }
  }

  const handleLastMove = () => {
    console.log("⏭️ LAST MOVE clicked")
    const currentIndex = myGame.current.currentMoveIndex
    const moves = myGame.current.getMoves()
    animateMoveTransition(currentIndex + 1, moves.length)
    myGame.current.setMoveIndex(moves.length - 1)
    bumpGame()
  }

  // Game Control Event Handlers
  const handleResign = () => {
    console.log("🏳️ RESIGN clicked")
    sendJson("game:resign", { shortcode })
  }

  const handleOfferDraw = () => {
    console.log("🤝 OFFER DRAW clicked")
  }

  // Analysis Event Handlers
  const handleToggleAnalysis = (enabled: boolean) => {
    console.log(`🔬 ANALYSIS TOGGLED: ${enabled ? 'ON' : 'OFF'}`)
  }

  const handleSettingsClick = () => {
    console.log("⚙️ SETTINGS clicked")
  }

  const handleCancelMatchmaking = () => {
    console.log("🎮 START POPUP: Cancelled matchmaking")
    setShowStartPopup(false)
    if (isGameRunningRef.current) return
    if (connected && shortcode) {
      sendJson("matchmaking:leave", { shortcode })
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
        sendJson("game:enquire", { shortcode })
        console.log("📤 WEBSOCKET: Sent timeup event for shortcode:", shortcode)
      }, 100)
    }
  }


  return (
    <>
    <GameBoardLayout
      ref={gameBoardRef}
      meRef={meRef}
      opponentRef={opponentRef}
      isRedRef={isRedRef}
      lastMoveRef={lMoveRef}
      rTimeRef={pTimesRef}
      currentTurnRef={currentTurnRef}
      isGameRunningRef={isGameRunningRef}
      myGameRef={myGame}
      lastMoveProp={lMoveRef.current}
      scoreRatio={scoreRatio}
      onPauseGame={() => {}}
      onResetGame={handleResetGame}
      // Use version signal to refresh board/timers when refs change
      boardVersion={Math.max(gameVersion, timeVersion)}
      positionVersion={positionVersion}
      onBoardReady={handleBoardReady}
      onTimeUp={handleTimeUp}
      boardProps={{
        interactive: true,
        // Replay existing moves only for the setup-triggered remount (guards StrictMode double-mount)
        animate_init: animateInit && positionVersion === replayPosVersionRef.current,
        onColumnAttempt: handleColumnAttempt,
        ariaLabel: "Live Connect 4 game board",
      }}
    >
      <LiveGameWithAnalysis 
        key="unique-livegame-instance"
        ref={liveGameRef}
        initialChatMessages={chatMessages}
        game={myGame.current}
        meRef={meRef}
        currentMoveIndex={myGame.current.currentMoveIndex}
        onMessageSent={handleMessageSent}
        onMoveClick={handleMoveClick}
        onFirstMove={handleFirstMove}
        onPreviousMove={handlePreviousMove}
        onNextMove={handleNextMove}
        onLastMove={handleLastMove}
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        onToggleAnalysis={handleToggleAnalysis}
        onSettingsClick={handleSettingsClick}
        showAnalysisFeatures={showAnalysis}
      />
    </GameBoardLayout>

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
      forceUpdateTrigger={Math.max(gameVersion, timeVersion)}
    />
    </>
  )
}
