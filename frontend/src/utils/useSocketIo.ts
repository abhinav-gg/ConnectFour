import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketIoOptions {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  heartbeatInterval?: number;
}

interface UseSocketIoResult {
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
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    heartbeatInterval = 60000,
  } = options;

  const [hasMounted, setHasMounted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const lastJsonRef = useRef<any | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [connected, setConnected] = useState(false);

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
      onMessage?.(data);
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
      onError?.(err);
    });
  }, [url, onConnect, onDisconnect, onMessage, onError, startHeartbeat, stopHeartbeat]);

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

  return { sendJson, connected, close, getLastJson };
}

export default useSocketIo;
