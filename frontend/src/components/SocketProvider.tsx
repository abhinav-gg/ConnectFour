'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useSocketIo from '@/utils/useSocketIo';

interface SocketContextType {
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
  const { sendJson, connected, close, getLastJson } = useSocketIo(url);

  return (
    <SocketContext.Provider value={{ sendJson, connected, close, getLastJson }}>
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
