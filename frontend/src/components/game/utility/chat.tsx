"use client"

import type React from "react"
import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatePresence, motion } from "framer-motion"
import { Send, ChevronDown } from "lucide-react"

export interface ChatMessage {
  id: string
  username: string
  message: string
  type: "user" | "system" | "game"
  color: "red" | "yellow" | "white"
  timestamp: Date
  uid?: string // Added UID property for unique identification
}

export interface ChatRef {
  sendMessage: (message: string, username?: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  addSystemMessage: (message: string, username?: string) => void
  clearMessages: () => void
  addReceivedMessage: (message: string, username: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
}

interface GameChatProps {
  initialMessages?: ChatMessage[]
  currentUser: string
  onMessageSent?: (message: ChatMessage) => void
  maxMessages?: number // Limit for performance with hundreds of messages
}

const GameChat = forwardRef<ChatRef, GameChatProps>(({
  initialMessages = [],
  currentUser,
  onMessageSent,
  maxMessages = 500, // Keep last 500 messages for performance
}, ref) => {
  const [inputMessage, setInputMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const messageIdCounter = useRef(0)

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1
    return `msg_${Date.now()}_${messageIdCounter.current}`
  }, [])

  // Memoized message list to optimize rendering with hundreds of messages
  const visibleMessages = useMemo(() => {
    return chatMessages.slice(-maxMessages)
  }, [chatMessages, maxMessages])

  // Send message function exposed via ref
  const sendMessage = useCallback((
    message: string, 
    username: string = currentUser,
    type: ChatMessage["type"] = "user",
    color: ChatMessage["color"] = "yellow"
  ) => {
    const newMessage: ChatMessage = {
      id: generateMessageId(),
      username,
      message,
      type,
      color,
      timestamp: new Date(),
    }

    // Add message to chat state
    setChatMessages(prev => {
      const newMessages = [...prev, newMessage]
      return newMessages.length > maxMessages ? newMessages.slice(-maxMessages) : newMessages
    })

    return newMessage
  }, [currentUser, generateMessageId, maxMessages])

  // Add system message function
  const addSystemMessage = useCallback((message: string, username?: string) => {
    return sendMessage(message, username || "System", "system", "white")
  }, [sendMessage])

  // Add received message function (for external messages like WebSocket)
  const addReceivedMessage = useCallback((
    message: string, 
    username: string,
    type: ChatMessage["type"] = "user",
    color: ChatMessage["color"] = "white"
  ) => {
    const uid = `chat-uid-${Date.now()}-${messageIdCounter.current}`;
    const newMessage: ChatMessage = {
      id: generateMessageId(),
      username,
      message,
      type,
      color,
      timestamp: new Date(),
      uid,
    };

    console.log("📨 WEBSOCKET: Received message with UID ----------------------->:", uid, newMessage);

    setChatMessages(prev => {
      const newMessages = [...prev, newMessage];
      return newMessages.length > maxMessages ? newMessages.slice(-maxMessages) : newMessages;
    });

    return newMessage;
  }, [generateMessageId, maxMessages])

  // Clear all messages
  const clearMessages = useCallback(() => {
    setChatMessages([])
  }, [])

  // Expose functions via ref - NO DEPENDENCIES like Board.tsx for stability
  useImperativeHandle(ref, () => ({
    sendMessage: (message: string, username: string = currentUser, type: ChatMessage["type"] = "user", color: ChatMessage["color"] = "yellow") => {
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${++messageIdCounter.current}`,
        username,
        message,
        type,
        color,
        timestamp: new Date(),
      }

      setChatMessages(prev => {
        const newMessages = [...prev, newMessage]
        return newMessages.length > maxMessages ? newMessages.slice(-maxMessages) : newMessages
      })

      return newMessage
    },
    addSystemMessage: (message: string, username?: string) => {
      const systemMessage: ChatMessage = {
        id: `msg_${Date.now()}_${++messageIdCounter.current}`,
        username: username || "System",
        message,
        type: "system",
        color: "white",
        timestamp: new Date(),
      }

      setChatMessages(prev => {
        const newMessages = [...prev, systemMessage]
        return newMessages.length > maxMessages ? newMessages.slice(-maxMessages) : newMessages
      })

      return systemMessage
    },
    clearMessages: () => {
      setChatMessages([])
    },
    addReceivedMessage: (message: string, username: string, type: ChatMessage["type"] = "user", color: ChatMessage["color"] = "white") => {
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${++messageIdCounter.current}`,
        username,
        message,
        type,
        color,
        timestamp: new Date(),
      }
      console.log("📨 WEBSOCKET: Received message via ref ----------------------->:", newMessage)
      setChatMessages(prev => {
        const newMessages = [...prev, newMessage]
        return newMessages.length > maxMessages ? newMessages.slice(-maxMessages) : newMessages
      })

      return newMessage
    },
  })) // NO dependency array - keeps ref stable across renders

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleMessages])

  // Handle scroll event to show/hide "Jump to Bottom" button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        setShowScrollToBottom(scrollHeight - scrollTop > clientHeight + 10)
      }
    }

    const currentScrollRef = scrollRef.current
    if (currentScrollRef) {
      currentScrollRef.addEventListener("scroll", handleScroll)
      handleScroll()
    }

    return () => {
      if (currentScrollRef) {
        currentScrollRef.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: generateMessageId(),
        username: currentUser,
        message: inputMessage.trim(),
        type: "user",
        color: "yellow",
        timestamp: new Date(),
      }

      // ONLY notify parent for validation/server sending - DON'T add to state here
      onMessageSent?.(newMessage)
      
      setInputMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const getMessageColor = (message: ChatMessage) => {
    switch (message.color) {
      case "red":
        return "text-red-400"
      case "yellow":
        return "text-brand-accent-yellow"
      default:
        return "text-white"
    }
  }

  const quickMessages = ["HI", "GL", "GG", "GTG"]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h3 className="text-white text-lg font-bold text-center mb-2 flex-shrink-0">Chat</h3>

      {/* Chat Messages - Fixed height with scroll */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="bg-brand-primary/40 rounded-lg p-3 overflow-y-auto scrollbar-custom h-full"
          style={{ minHeight: '330px', maxHeight: '330px' }}
        >
          {visibleMessages.length === 0 ? (
            <div className="text-brand-text-muted text-sm text-center py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-2">
              {visibleMessages.map((message) => (
                <motion.div
                  key={message.id}
                  className="text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-semibold ${getMessageColor(message)}`}>
                    {message.username}:
                  </span>
                  <span className="text-white ml-2">{message.message}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Jump to Bottom Button */}
        <AnimatePresence>
          {showScrollToBottom && (
            <motion.button
              onClick={scrollToBottom}
              className="absolute bottom-2 right-2 bg-brand-accent-green/80 hover:bg-brand-accent-green text-white p-2 rounded-full shadow-lg z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Message Input - Fixed height */}
      <div className="flex gap-2 mt-2 mb-2 flex-shrink-0">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Send message"
          className="flex-1 bg-brand-primary/60 border-brand-border text-white placeholder:text-brand-text-muted text-sm h-8"
        />
        <Button
          onClick={handleSendMessage}
          size="icon"
          className="bg-brand-accent-green hover:bg-brand-accent-green/80 h-8 w-8"
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>

      {/* Quick Messages - Fixed height */}
      <div className="grid grid-cols-4 gap-1 flex-shrink-0">
        {quickMessages.map((msg) => (
          <Button
            key={msg}
            onClick={() => {
              const newMessage: ChatMessage = {
                id: generateMessageId(),
                username: currentUser,
                message: msg,
                type: "user",
                color: "yellow",
                timestamp: new Date(),
              }

              // ONLY notify parent for validation/server sending - DON'T add to state here
              onMessageSent?.(newMessage)
            }}
            variant="secondary"
            size="sm"
            className="bg-brand-primary/60 hover:bg-brand-primary/80 text-white text-xs h-6"
          >
            {msg}
          </Button>
        ))}
      </div>
    </div>
  )
})

GameChat.displayName = "GameChat"

export default GameChat
