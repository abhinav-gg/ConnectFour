import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketIoOptions {
  onMessage?: (data: any) => void;
  onPrefixedMessage?: (event: string, data: any) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  heartbeatInterval?: number;
}

interface UseSocketIoResult {
  onMessage: (callback: (data: any) => void) => void;
  onPrefixedMessage: (prefix: string, callback: (event: string, data: any) => void) => void;
  onError: (callback: (error: Error) => void) => void;
  sendJson: (event: string, data: object) => void;
  connected: boolean;
  close: () => void;
  getLastJson: () => any | null;
}

function useSocketIo(
  url: string,
  options: UseSocketIoOptions = {}
): UseSocketIoResult {
  const {
    onMessage: initialOnMessage,
    onPrefixedMessage: initialOnPrefixedMessage,
    onConnect,
    onDisconnect,
    onError: initialOnError,
    heartbeatInterval = 6000,
  } = options;

  const [hasMounted, setHasMounted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const lastJsonRef = useRef<any | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [connected, setConnected] = useState(false);
  
  // Callback refs for dynamic event handling
  const onMessageCallbackRef = useRef<((data: any) => void) | null>(initialOnMessage || null);
  const onPrefixedMessageCallbacksRef = useRef<Map<string, (event: string, data: any) => void>>(new Map());
  const onErrorCallbackRef = useRef<((error: Error) => void) | null>(initialOnError || null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => {
      socketRef.current?.emit("ping");
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current) return; // already connected or connecting
    console.log("CONNECTING........")
    const socket = io(url, {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      onConnect?.();
      startHeartbeat();
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      onDisconnect?.(reason);
      stopHeartbeat();
    });

    socket.on("message", (data) => {
      lastJsonRef.current = data;
      onMessageCallbackRef.current?.(data);
    });

    // Listen to all events for prefixed message handling
    socket.onAny((event, data) => {
      if (event !== "message" && event !== "connect" && event !== "disconnect" && event !== "error" && event !== "ping" && event !== "pong") {
        lastJsonRef.current = { event, data };
        
        // Check all registered prefixes
        onPrefixedMessageCallbacksRef.current.forEach((callback, prefix) => {
          if (event.startsWith(prefix + ":")) {
            const eventWithoutPrefix = event.slice(prefix.length + 1); // +1 to remove the colon
            callback(eventWithoutPrefix, data);
          }
        });
      }
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnect attempt #${attempt}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnect error:', error);
    });
    
    socket.on('reconnect_failed', () => {
      console.warn('Reconnect failed, will stop retrying');
    });

    socket.on("error", (err) => {
      onErrorCallbackRef.current?.(err);
    });
  }, [url, onConnect, onDisconnect, startHeartbeat, stopHeartbeat]);

  useEffect(() => {
    if (!hasMounted) return;

    connect();

    return () => {
      stopHeartbeat();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [hasMounted, connect, stopHeartbeat]);

  const sendJson = useCallback((event: string, data: object) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const close = useCallback(() => {
    stopHeartbeat();
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, [stopHeartbeat]);

  const getLastJson = useCallback(() => lastJsonRef.current, []);

  // Callback registration functions
  const registerOnMessage = useCallback((callback: (data: any) => void) => {
    onMessageCallbackRef.current = callback;
  }, []);

  const registerOnPrefixedMessage = useCallback((prefix: string, callback: (event: string, data: any) => void) => {
    console.log(`[useSocketIO] Registering prefix handler for: ${prefix}`);
    onPrefixedMessageCallbacksRef.current.set(prefix, callback);
  }, []);

  const registerOnError = useCallback((callback: (error: Error) => void) => {
    onErrorCallbackRef.current = callback;
  }, []);

  return { 
    onMessage: registerOnMessage,
    onPrefixedMessage: registerOnPrefixedMessage,
    onError: registerOnError,
    sendJson, 
    connected, 
    close, 
    getLastJson 
  };
}

export default useSocketIo;
