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

import { useState, useEffect, useRef, useMemo } from "react"
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
  const { sendJson, connected, close, getLastJson, onError, onPrefixedMessage } = useSocketContext()
  
  // Get user context for fallback player data
  const { user } = useUser()

  // Use refs for data that gets updated by WebSocket events to avoid re-renders
  const meRef = useRef<PlayerData>()
  const opponentRef = useRef<PlayerData>()
  const currentTurnRef = useRef(-1)
  const isRedRef = useRef(false)
  const lMoveRef = useRef(0)
  const pTimesRef = useRef<[number, number]>([0, 0])
  const isGameRunningRef = useRef(false) // Use ref instead of state to persist without re-renders
  const eloChangesRef = useRef<EloChange | null>(null)
  const myGame = useRef(new StandardGame()) // Use a new instance of StandardGame for this live game

  // Initialize meRef with user context data as fallback
  useEffect(() => {
    if (user && !meRef.current) {
      meRef.current = {
        username: user.username,
        pfp: user.pfp || '/icons/user.svg',
        time: 300000, // Default 5 minutes in milliseconds
        elo: undefined // Will be updated when real data arrives
      }
      console.log("🔄 INIT: Set initial meRef from user context:", meRef.current)
      triggerUpdate() // Force re-render to show the initial data
    }
  }, [user])

  const [scoreRatio, setScoreRatio] = useState(0.5)
  
  // Analysis Control - Toggle this to hide/show analysis features
  const [showAnalysis, setShowAnalysis] = useState(false)
  const liveGameRef = useRef<LiveGameRef>(null) // Reference to LiveGameWithAnalysis for direct chat control
  const gameBoardRef = useRef<BoardHandle>(null) // Reference to GameBoardLayout for board control

  // Move navigation state
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  
  // Game Start Modal State
  const [showStartPopup, setShowStartPopup] = useState(false)
  const [gameMode, setGameMode] = useState("Standard")
  const [timeControl, setTimeControl] = useState("5+3")
  const [gameUrl, setGameUrl] = useState("")
  
  // Add a state to force re-renders when refs change
  const [forceUpdate, setForceUpdate] = useState(0)
  
  // Game End Modal State
  const [showEndPopup, setShowEndPopup] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isSpectating, setIsSpectating] = useState(false)
  
  // Create a function to trigger re-renders
  const triggerUpdate = () => {
    setForceUpdate(prev => prev + 1)
    console.log("🔄 DEBUG: Forced component re-render")
  }

  // Effect to ensure game board ref stays in sync with game state
  useEffect(() => {
    if (myGame.current && gameBoardRef.current) {
      // The board will automatically update via props since boardState is derived from myGame
      console.log("🔄 GAME: Game state updated, board will reflect changes")
    }
  }, [forceUpdate]) // Trigger when forceUpdate changes

  const [startSFX] = [useSound("/sounds/start.mp3")]

  // Chat and Move History State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
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

  // Step 1: Register ALL socket handlers immediately on mount (prevents race condition)
  useEffect(() => {
    console.log("🔌 WEBSOCKET: Registering event handlers immediately")
    
    onPrefixedMessage("matchmaking", (event, data) => {
      console.log("� WEBSOCKET: Received matchmaking event:", event, "with data:", data)
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
            return // Don't process if shortcodes don't match
          }
          setGameMode("TEST GAMEMODE")
          break
        default:
          console.warn(`📨 WEBSOCKET: Unhandled matchmaking event ${event} with data:`, data)
      }
    });

    onPrefixedMessage("game", (event, data) => {
      console.log("📨 WEBSOCKET: Received game event:", event, "with data:", data)
      switch (event) {

        case "setup": {
          const setupData = data as StandardGameMetadata
          // Keep the popup open for a moment to show the match found animation
          // Then close it after the user sees the match
          setTimeout(() => {
            setShowStartPopup(false)
            console.log("🎮 MATCHMAKING: Closed start popup after showing match found")
          }, 3000) // Show match found for 3 seconds

          // start setting the props as needed:
          // Update meRef with server data, preserving fallback data where needed
          meRef.current = {
            username: setupData.me.username,
            pfp: setupData.me.pfp || meRef.current?.pfp || '/icons/user.svg',
            time: setupData.me.time,
            elo: setupData.me.elo
          }
          opponentRef.current = setupData.opponent
          isRedRef.current = setupData.iRed
          lMoveRef.current = setupData.lTime
          pTimesRef.current = setupData.rTimes
          currentTurnRef.current = setupData.turn
          isGameRunningRef.current = true
          eloChangesRef.current = setupData.eloChanges
          myGame.current = new StandardGame(setupData.moves || [])
          
          // Update current move index to show the latest move if there are existing moves
          if (setupData.moves && setupData.moves.length > 0) {
            setCurrentMoveIndex(setupData.moves.length)
            console.log(`🎮 GAME: Set currentMoveIndex to ${setupData.moves.length} for existing moves`)
          }
          
          console.log("🎮 MATCHMAKING: Updated meRef with server data:", meRef.current)
          // IMPORTANT: Force re-render since refs don't cause re-renders
          triggerUpdate()
          
          // // Also trigger layout refresh if available
          // if ((window as any).__gameLayoutRefresh) {
          //   (window as any).__gameLayoutRefresh()
          //   console.log("🔄 DEBUG: Triggered layout refresh")
          // } else {
          //   console.error("❌ DEBUG: Layout refresh function not available!")
          // }

          break;
        }
        case "spectate": {
          const setupData = data as StandardSpectatingMetadata
          setIsSpectating(true)
          // Phase 2: Data is now automatically available through the refs
          // No need to manually update state - the modal will read from refs
          console.log("🎮 MATCHMAKING: Opponent data available in refs for phase 2")
          
          // Keep the popup open for a moment to show the match found animation
          // Then close it after the user sees the match
          setTimeout(() => {
            setShowStartPopup(false)
            console.log("🎮 MATCHMAKING: Closed start popup after showing match found")
          }, 3000) // Show match found for 3 seconds

          // start setting the props as needed:
          // meRef.current = setupData.me
          // opponentRef.current = setupData.opponent
          // isRedRef.current = setupData.iRed
          lMoveRef.current = setupData.lTime
          pTimesRef.current = setupData.rTimes
          currentTurnRef.current = setupData.turn
          isGameRunningRef.current = true
          // eloChangesRef.current = setupData.eloChanges
          
          // Create game instance with existing moves for spectating
          if (setupData.moves) {
            myGame.current = new StandardGame(setupData.moves)
            setCurrentMoveIndex(setupData.moves.length)
            console.log(`🎮 SPECTATE: Set up game with ${setupData.moves.length} existing moves`)
            console.log("🎮 SPECTATE: Board state after setup:", myGame.current.getBoard())
            triggerUpdate() // Force re-render to show the board state
          }

          break;
        }
        case "chat" : {
          // Add the validated/censored message back to chat using the correct method
          const validatedMessage = data as ChatMessage
          if (liveGameRef.current) {
            liveGameRef.current!.addChatMessage(validatedMessage.message, validatedMessage.username, validatedMessage.type, validatedMessage.color)
            console.log("✅ CHAT: Added validated message via ref")
          } else {
            console.error("❌ CHAT: LiveGameRef not available to add message")
          }
          break;
        }
        case "move": {
          // Handle incoming move data
          const moveData = data as StandardGameMove
          console.log("📨 WEBSOCKET: Received move data:", JSON.stringify(moveData))

          // Update the game instance with the new move
          try {
            myGame.current.makeMove(moveData.col)
            console.log("🎮 GAME: Updated game instance with move", moveData.col)
          } catch (error) {
            console.error("❌ GAME: Failed to update game instance with move", moveData.col, error)
          }

          lMoveRef.current = moveData.lMove
          isGameRunningRef.current = true // Ensure game is running after any move
          
          // call game board reference triggerMoveAnimation
          if (gameBoardRef.current && gameBoardRef.current.triggerMoveAnimation) {
            gameBoardRef.current.triggerMoveAnimation(moveData.row, moveData.col, moveData.player)
            console.log("🎯 BOARD: Triggered move animation for column", moveData.col)
          } else {
            console.warn("⚠️ BOARD: GameBoardRef not available for move animation")
          }
          
          // Update current turn - alternate between 0 and 1
          currentTurnRef.current = (currentTurnRef.current + 1) % 2
          
          // Update last move timestamp and remaining times
          lMoveRef.current = moveData.lMove;
          pTimesRef.current = moveData.rTimes;
          // Update current move index to show latest move
          setCurrentMoveIndex(myGame.current.getMoves().length)

          break;
        }
        case "over": {
          // Game has ended
          isGameRunningRef.current = false
          setShowStartPopup(false) // Ensure start popup is closed
          const { result } = data
          // this result is the state to use

          // Set game state and show end popup
          setGameState(result)
          setShowEndPopup(true)

          console.log("🏁 GAME: Game has ended", { result })
          
          break;
        }

        default:
          console.warn(`📨 WEBSOCKET: Unhandled event ${event} with data:`, data)
          break;

      }
    });
    
  }, []); // Empty dependency array - register handlers once immediately on mount

  // Step 2: Handle URL parameter and join matchmaking (connection-dependent logic)
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
    
    // Join matchmaking when socket is connected
    if (connected) {
      sendJson("matchmaking:join", { shortcode: roomParam })
      console.log("📤 WEBSOCKET: Sent join matchmaking with shortcode:", roomParam)
    }
  }, [searchParams, router, connected, sendJson])

  // Handle cleanup listeners  
  useEffect(() => {
    let sentLeave = false;

    const handleCloseSocket = () => {
      if (connected && !sentLeave) {
        sendJson("game:leave", {  })
        sentLeave = true;
      }
    };

    window.addEventListener('pagehide', handleCloseSocket); // preferred
    window.addEventListener('beforeunload', handleCloseSocket); // fallback for older browsers

    
    return () => {
      // Cleanup listeners on unmount
      window.removeEventListener('pagehide', handleCloseSocket);
      window.removeEventListener('beforeunload', handleCloseSocket);
      // consider custom disonnect logic if needed
    }
  }, [connected, sendJson])

  
  const handleResetGame = () => {
    console.log("🔄 RESET GAME clicked")
    setScoreRatio(0.5)
    isGameRunningRef.current = false
    setChatMessages([])
    setCurrentMoveIndex(0)
    
    // Reset the game instance
    myGame.current.reset()
    console.log("🎮 GAME: Reset game instance")
    
    // Reset meRef to fallback user context data
    if (user) {
      meRef.current = {
        username: user.username,
        pfp: user.pfp || '/icons/user.svg',
        time: 300000, // Default 5 minutes in milliseconds
        elo: undefined // Will be updated when new game data arrives
      }
      console.log("🔄 RESET: Reset meRef to user context fallback:", meRef.current)
    } else {
      meRef.current = undefined
    }
    
    // Clear opponent data
    opponentRef.current = undefined
    
    // Clear the chat using the ref
    if (liveGameRef.current) {
      liveGameRef.current.clearChat()
      console.log("💬 CHAT CLEARED via ref")
    }
  }

  const handleColumnAttempt = (col: number) => {
    console.log(`🎯 COLUMN ATTEMPT: Player attempted move in column ${col}`)
    if (isSpectating) {
      console.log("👁️ SPECTATING: Player is spectating, move not sent")
      return
    }
    // Send move via Socket if connected
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
    // Send message via Socket if connected
    if (connected) {
      sendJson("game:chat",
        {
          shortcode,
          message: message.message
        })
      console.log("📤 WEBSOCKET: Sending message to server:", message.message)
    } else {
      console.log("📤 WEBSOCKET: Not connected, message not sent:", message.message)
    }
  }

  // Move History Event Handlers
  const handleMoveClick = (moveIndex: number) => {
    console.log(`📖 MOVE CLICKED: Move ${moveIndex + 1}`)
    setCurrentMoveIndex(moveIndex)
  }

  const handleFirstMove = () => {
    console.log("⏮️ FIRST MOVE clicked")
    setCurrentMoveIndex(0)
  }

  const handlePreviousMove = () => {
    console.log("⏪ PREVIOUS MOVE clicked")
    setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1))
  }

  const handleNextMove = () => {
    console.log("⏩ NEXT MOVE clicked")
    setCurrentMoveIndex(Math.min(myGame.current.getMoves().length, currentMoveIndex + 1))
  }

  const handleLastMove = () => {
    console.log("⏭️ LAST MOVE clicked")
    setCurrentMoveIndex(myGame.current.getMoves().length)
  }

  // Game Control Event Handlers
  const handleResign = () => {
    console.log(myGame.current.getBoard())
    console.log("🏳️ RESIGN clicked")
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
    if (isGameRunningRef.current) {
      return;
    }
    // Send cancel message to server if needed
    if (connected && shortcode) {
      sendJson("matchmaking:leave", { shortcode })
      console.log("📤 WEBSOCKET: Sent leave matchmaking")
    }
    // Redirect back to setup
    router.push("/play/setup")
  }

  // Game End Modal Handlers
  const handleCloseEndPopup = () => {
    console.log("🏁 END POPUP: Closed")
    setShowEndPopup(false)
  }

  const handleReviewGame = () => {
    console.log("📊 REVIEW GAME clicked")
    // TODO: Implement game review functionality
    setShowEndPopup(false)
  }

  const handleNewGame = () => {
    console.log("🆕 NEW GAME clicked") 
    setShowEndPopup(false)
    router.push("/play/setup")
  }

  const handleRematch = () => {
    console.log("🔄 REMATCH clicked")
    // TODO: Implement rematch functionality
    setShowEndPopup(false)
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
      isGameRunningRef={isGameRunningRef} // Pass ref instead of state
      myGameRef={myGame} // Pass the game ref for move management
      lastMoveProp={lMoveRef.current}
      scoreRatio={scoreRatio}
      onPauseGame={() => {}}
      onResetGame={handleResetGame}
      boardProps={{
        interactive: true,
        animate_init: false,
        onColumnAttempt: handleColumnAttempt,
        ariaLabel: "Live Connect 4 game board",
      }}
    >
      <LiveGameWithAnalysis 
        key="unique-livegame-instance" // FIXED: Ensure only one instance across desktop/mobile layouts
        ref={liveGameRef}
        initialChatMessages={chatMessages}
        game={myGame.current}
        meRef={meRef}
        currentMoveIndex={currentMoveIndex}
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
      mistakes={0} // TODO: Get from game analysis
      blunders={0} // TODO: Get from game analysis  
      greatMoves={0} // TODO: Get from game analysis
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
      forceUpdateTrigger={forceUpdate}
    />
    </>
  )
}
