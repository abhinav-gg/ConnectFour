import React, { createContext, useContext, useState, ReactNode } from "react";
import useWebSocket from "@/utils/useWebsocket";

interface WebSocketContextType {
  sendMessage: (msg: string) => void;
  readyState: number;
  lastMessage: string | null;
  close: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  url: string;
  children: ReactNode;
}

export function WebSocketProvider({ url, children }: WebSocketProviderProps) {
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const { sendMessage, readyState, close } = useWebSocket(url, {
    onMessage: (msg) => setLastMessage(msg),
    heartbeatInterval: 20000,
  });

  return (
    <WebSocketContext.Provider
      value={{ sendMessage, readyState, lastMessage, close }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
}
