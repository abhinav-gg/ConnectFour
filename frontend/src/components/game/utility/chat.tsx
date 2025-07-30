"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatePresence, motion } from "framer-motion"
import { Send, ChevronDown } from "lucide-react"

export interface ChatMessage {
  id: string
  username: string
  message: string
  type: "user" | "system" | "game"
  color: "red" | "green" | "white"
  timestamp: Date
}


const GameChat: React.FC<{
  messages?: ChatMessage[]
  currentUser: string
  onSendMessage?: (message: string) => void
}> = ({ messages, currentUser, onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  // Default messages for demonstration
  const defaultMessages: ChatMessage[] = [
    {
      id: "1",
      username: "anonymous",
      message: "You Suck",
      type: "user",
      color: "red",
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: "2",
      username: "Anonymous",
      message: "Disconnected",
      type: "system",
      color: "white",
      timestamp: new Date(Date.now() - 240000),
    },
    {
      id: "3",
      username: "astrochamp",
      message: "You Suck Twat",
      type: "user",
      color: "green",
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: "4",
      username: "GAME",
      message: "OVER",
      type: "game",
      color: "white",
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: "5",
      username: "System",
      message: "Astrochamp won by abandonment.",
      type: "system",
      color: "white",
      timestamp: new Date(Date.now() - 90000),
    },
    {
      id: "6",
      username: "System",
      message: "Your new rating is 120 (+19)",
      type: "system",
      color: "white",
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "7",
      username: "astrochamp",
      message: "Lmfao that was the easier Game that I have ever played LOOOOOL",
      type: "user",
      color: "green",
      timestamp: new Date(Date.now() - 30000),
    },
  ]

  useEffect(() => {
    setChatMessages(messages || defaultMessages)
  }, [messages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

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
        id: Date.now().toString(),
        username: currentUser,
        message: inputMessage.trim(),
        type: "user",
        color: "white",
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, newMessage])
      onSendMessage?.(inputMessage.trim())
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
      case "green":
        return "text-brand-accent-green"
      default:
        return "text-white"
    }
  }

  const quickMessages = ["HI", "GL", "GG", "GTG"]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h3 className="text-white text-lg font-bold text-center mb-2 flex-shrink-0">Chat</h3>

      {/* Chat Messages - Fixed height with scroll */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="bg-brand-primary/40 rounded-lg p-3 overflow-y-auto scrollbar-custom max-h-[330px]"
        >
          <AnimatePresence>
            {chatMessages.map((message) => (
              <motion.div
                key={message.id}
                className="mb-2 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className={`font-semibold ${getMessageColor(message)}`}>{message.username}:</span>
                <span className="text-white ml-2">{message.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
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
              setInputMessage(msg)
              setTimeout(handleSendMessage, 100)
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
}

export default GameChat
