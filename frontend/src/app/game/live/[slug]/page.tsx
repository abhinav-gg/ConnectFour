"use client"

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
import { useParams, useRouter } from "next/navigation"
import { GameBoardLayout } from "@/components/layouts/game-board-layout"
import { LiveGameWithAnalysis, LiveGameRef } from "@/components/game/LiveGameUI"
import { ChatMessage } from "@/components/game/utility/chat"
import useSound from "@/utils/useSound"
import { useSocketContext } from "@/components/providers/SocketProvider"

interface Move {
  column: number
  player: "red" | "yellow"
  moveNumber: number
}

export default function LiveGamePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  // Extract shortcode from slug or redirect if empty
  const [shortcode, setShortcode] = useState<string>("")
  
  // Use the existing SocketIO hook
  const { sendJson, connected, close, getLastJson } = useSocketContext()

  const [player1Time, setPlayer1Time] = useState(300) // 5 minutes
  const [player2Time, setPlayer2Time] = useState(300) // 5 minutes
  const [scoreRatio, setScoreRatio] = useState(0.5)
  const [isGameRunning, setIsGameRunning] = useState(true) // Game is live
  
  // Analysis Control - Toggle this to hide/show analysis features
  const [showAnalysis, setShowAnalysis] = useState(false)
  const liveGameRef = useRef<LiveGameRef>(null) // Reference to LiveGameWithAnalysis for direct chat control

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

  const [moves, setMoves] = useState<Move[]>([
    { column: 4, player: "red", moveNumber: 1 },
    { column: 4, player: "yellow", moveNumber: 2 },
    { column: 3, player: "red", moveNumber: 3 },
    { column: 5, player: "yellow", moveNumber: 4 },
  ])

  // Handle slug parameter and join matchmaking
  useEffect(() => {
    if (!slug || slug.trim() === "") {
      console.log("🔌 REDIRECT: Empty slug, redirecting to /play/setup")
      router.push("/play/setup")
      return
    }
    
    setShortcode(slug)
    console.log("🔌 SHORTCODE: Extracted from slug:", slug)
    
    // Join matchmaking when socket is connected
    if (connected) {
      sendJson( "/matchmaking/join", { shortcode: slug })
      console.log("📤 WEBSOCKET: Sent join matchmaking with shortcode:", slug)
    }
  }, [slug, router, connected, sendJson])

  // Listen for socket events
  useEffect(() => {
    const lastMessage = getLastJson()
    if (!lastMessage) return

    // Handle different event types
    switch (lastMessage.event) {
      case "/matchmaking/joined":
        console.log("✅ MATCHMAKING: Successfully joined with shortcode:", lastMessage.data?.shortcode)
        break
      
      case "/game/move":
        const moveData = lastMessage.data
        if (moveData) {
          const newMove: Move = {
            column: moveData.column,
            player: moveData.player,
            moveNumber: moveData.moveNumber,
          }
          setMoves(prev => [...prev, newMove])
          console.log("📨 WEBSOCKET: Received move from opponent:", newMove)
        }
        break
      
      case "/chat/message":
        const chatData = lastMessage.data
        if (chatData && liveGameRef.current) {
          liveGameRef.current.addReceivedMessage(
            chatData.message, 
            chatData.username, 
            "user", 
            chatData.color || "red"
          )
          console.log("📨 WEBSOCKET: Received chat message:", chatData.message)
        }
        break
    }
  }, [getLastJson])

  // Simulate WebSocket connection for demonstration
  useEffect(() => {

    // Simulate receiving a message from opponent after 5 seconds
    const messageTimer = setTimeout(() => {
      // Use the LiveGameUI ref to add messages directly to chat
      if (liveGameRef.current) {
        liveGameRef.current.addReceivedMessage("Nice move!", "Opponent", "user", "red")
        console.log("📨 WEBSOCKET: Received message from opponent via ref: Nice move!")
      }
    }, 5000)

    // Simulate receiving another message after 10 seconds
    const systemMessageTimer = setTimeout(() => {
      if (liveGameRef.current) {
        liveGameRef.current.addSystemMessage("Game will end in 2 minutes", "Game Server")
        console.log("📨 WEBSOCKET: Received system message via ref with custom username")
      }
    }, 10000)

    // Simulate receiving another system message after 15 seconds with default username
    const defaultSystemMessageTimer = setTimeout(() => {
      if (liveGameRef.current) {
        liveGameRef.current.addSystemMessage("Connection stable")
        console.log("📨 WEBSOCKET: Received system message via ref with default username")
      }
    }, 15000)

    // Simulate adding a chat message from external source after 20 seconds
    const externalChatTimer = setTimeout(() => {
      if (liveGameRef.current) {
        liveGameRef.current.addChatMessage("Hello from external source!", "API Bot", "user", "yellow")
        console.log("📨 WEBSOCKET: Added chat message from external source via ref")
      }
    }, 20000)

    // Simulate receiving a move from opponent after 8 seconds
    const moveTimer = setTimeout(() => {
      const newMove: Move = {
        column: 2,
        player: "yellow",
        moveNumber: moves.length + 1,
      }
      setMoves(prev => [...prev, newMove])
      console.log("📨 WEBSOCKET: Received move from opponent:", newMove)
    }, 8000)

    return () => {
      clearTimeout(messageTimer)
      clearTimeout(systemMessageTimer)
      clearTimeout(defaultSystemMessageTimer)
      clearTimeout(externalChatTimer)
      clearTimeout(moveTimer)
    }
  }, [moves.length])

  const handleStartGame = () => {
    console.log("🎮 START GAME clicked")
    setIsGameRunning(true)
  }
  
  const handlePauseGame = () => {
    console.log("⏸️ PAUSE GAME clicked")
    setIsGameRunning(false)
  }
  
  const handleResetGame = () => {
    console.log("🔄 RESET GAME clicked")
    setPlayer1Time(300)
    setPlayer2Time(300)
    setScoreRatio(0.5)
    setIsGameRunning(false)
    setChatMessages([])
    setMoves([])
    
    // Clear the chat using the ref
    if (liveGameRef.current) {
      liveGameRef.current.clearChat()
      console.log("💬 CHAT CLEARED via ref")
    }
  }

  const handleColumnAttempt = (col: number) => {
    console.log(`🎯 COLUMN ATTEMPT: Player attempted move in column ${col}`)
    
    // Add new move to moves array
    const newMove: Move = {
      column: col,
      player: moves.length % 2 === 0 ? "red" : "yellow",
      moveNumber: moves.length + 1,
    }
    setMoves(prev => [...prev, newMove])
    
    // Send move via Socket if connected
    if (connected) {
      sendJson("/game/move", { 
        shortcode, 
        column: col, 
        moveNumber: newMove.moveNumber,
        player: newMove.player
      })
      console.log("📤 WEBSOCKET: Sending move to server:", newMove)
    } else {
      console.log("📤 WEBSOCKET: Not connected, move not sent:", newMove)
    }
  }

  // Chat Event Handlers
  const handleMessageSent = (message: ChatMessage) => {
    console.log(`💬 MESSAGE SENT:`, message)
    
    // Send message via Socket if connected
    if (connected) {
      sendJson("/chat/message",
        {
          shortcode,
          message: message.message,
          username: message.username,
          color: message.color
      })
      console.log("📤 WEBSOCKET: Sending message to server:", message.message)
    } else {
      console.log("📤 WEBSOCKET: Not connected, message not sent:", message.message)
    }

    // Simulate backend validation/censoring (in real app, this would be async)
    let validatedMessage = { ...message }
    
    // Example: Simple profanity filter simulation
    if (message.message.toLowerCase().includes('bad')) {
      validatedMessage = {
        ...message,
        message: message.message.replace(/bad/gi, '***')
      }
      console.log("🚫 BACKEND: Message censored:", validatedMessage.message)
    }

    // Add the validated/censored message back to chat using the correct method
    if (liveGameRef.current) {
      // return;
      liveGameRef.current!.addChatMessage(validatedMessage.message, validatedMessage.username, validatedMessage.type, validatedMessage.color)
      console.log("✅ CHAT: Added validated message via ref")
    } else {
      console.error("❌ CHAT: LiveGameRef not available to add message")
    }
  }

  // Move History Event Handlers
  const handleMoveClick = (moveIndex: number) => {
    console.log(`📖 MOVE CLICKED: Move ${moveIndex + 1}`)
  }

  const handleFirstMove = () => {
    console.log("⏮️ FIRST MOVE clicked")
  }

  const handlePreviousMove = () => {
    console.log("⏪ PREVIOUS MOVE clicked")
  }

  const handleNextMove = () => {
    console.log("⏩ NEXT MOVE clicked")
  }

  const handleLastMove = () => {
    console.log("⏭️ LAST MOVE clicked")
  }

  // Game Control Event Handlers
  const handleResign = () => {
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


  return (
    <GameBoardLayout
      player1Name="Opponent"
      player2Name="You"
      player1Color="red"
      player2Color="yellow"
      player1Time={player1Time}
      player2Time={player2Time}
      scoreRatio={scoreRatio}
      isGameRunning={isGameRunning}
      onStartGame={handleStartGame}
      onPauseGame={handlePauseGame}
      onResetGame={handleResetGame}
      onPlayer1TimeChange={setPlayer1Time}
      onPlayer2TimeChange={setPlayer2Time}
      onScoreRatioChange={setScoreRatio}
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
    </GameBoardLayout>
  )
}
