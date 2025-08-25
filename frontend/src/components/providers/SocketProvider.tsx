'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useSocketIo from '@/utils/useSocketIo';

interface SocketContextType {
  onMessage: (callback: (data: any) => void) => void;
  onPrefixedMessage: (prefix: string, callback: (event: string, data: any) => void) => void;
  unsubscribePrefixedMessage: (prefix: string) => void;
  onError: (callback: (error: Error) => void) => void;
  sendJson: (event: string, data: object) => void;
  connected: boolean;
  close: () => void;
  getLastJson: () => any | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  url: string;
  children: ReactNode;
}

export function SocketProvider({ url, children }: SocketProviderProps) {
  const { onMessage, onPrefixedMessage, onError, sendJson, connected, unsubscribePrefixedMessage, close, getLastJson } = useSocketIo(url);

  return (
    <SocketContext.Provider value={{ onMessage, onPrefixedMessage, onError, sendJson, connected, unsubscribePrefixedMessage, close, getLastJson }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
}
