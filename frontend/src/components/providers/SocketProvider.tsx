'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useSocketIo from '@/utils/useSocketIo';
import { useError } from './errorProvider';

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
  const { showError } = useError();
  const { onMessage, onPrefixedMessage, onError, sendJson, connected, unsubscribePrefixedMessage, close, getLastJson } = useSocketIo(url);
  
  const customErrorHandlers = React.useRef<((error: Error) => void)[]>([]);

  // Enhanced onError that supports both announcement and custom handlers
  const enhancedOnError = React.useCallback((callback: (error: Error) => void) => {
    customErrorHandlers.current.push(callback);
  }, []);

  React.useEffect(() => {
    onError((error) => {
      // Always show the error announcement
      console.error(`[Socket Error] ${error}`);
      showError(error.message);
      
      // Also call custom handlers
      customErrorHandlers.current.forEach(handler => handler(error));
    });
  }, [onError, showError]);

  return (
    <SocketContext.Provider value={{ onMessage, onPrefixedMessage, onError: enhancedOnError, sendJson, connected, unsubscribePrefixedMessage, close, getLastJson }}>
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
