'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useWebSocket from '@/utils/useWebsocket';

interface WebSocketContextType {
  sendJson: (data: object) => void;
  readyState: number;
  close: () => void;
  getLastJson: () => any | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  url: string;
  children: ReactNode;
}

export function WebSocketProvider({ url, children }: WebSocketProviderProps) {
  const { sendJson, readyState, close, getLastJson } = useWebSocket(url);

  return (
    <WebSocketContext.Provider
      value={{ sendJson, readyState, close, getLastJson }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
}
