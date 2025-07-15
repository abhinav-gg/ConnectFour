import { useEffect, useRef, useState, useCallback } from "react";

export const WEBSOCKET_DEFAULTS = {
    maxRetries: 5,
    initialReconnectDelay: 1000,    // 1 second
    maxReconnectDelay: 30000,       // 30 seconds max
    heartbeatInterval: 20000,       // 20 seconds ping/pong
};


interface UseWebSocketOptions {
    onMessage?: (message: string) => void;
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (error: Event | Error) => void;
    maxRetries?: number;
    initialReconnectDelay?: number;
    maxReconnectDelay?: number;
    heartbeatInterval?: number;
  }
  
  interface UseWebSocketResult {
    sendMessage: (message: string) => void;
    readyState: number;
    close: () => void;
  }
  
  function useWebSocket(
    url: string,
    options: UseWebSocketOptions = {}
  ): UseWebSocketResult {
    const {
      onMessage,
      onOpen,
      onClose,
      onError,
      maxRetries = WEBSOCKET_DEFAULTS.maxRetries,
      initialReconnectDelay = WEBSOCKET_DEFAULTS.initialReconnectDelay,
      maxReconnectDelay = WEBSOCKET_DEFAULTS.maxReconnectDelay,
      heartbeatInterval = WEBSOCKET_DEFAULTS.heartbeatInterval,
    } = options;
  
    const ws = useRef<WebSocket | null>(null);
    const retryCount = useRef(0);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimeout = useRef<NodeJS.Timeout | null>(null);
    const messageQueue = useRef<string[]>([]);
    const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
    const manualClose = useRef(false);
  
    const sendHeartbeat = useCallback(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        try {
          ws.current.send(JSON.stringify({ type: "ping" }));
        } catch {}
      }
      heartbeatTimeout.current = setTimeout(sendHeartbeat, heartbeatInterval);
    }, [heartbeatInterval]);
  
    const flushMessageQueue = useCallback(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        while (messageQueue.current.length > 0) {
          ws.current.send(messageQueue.current.shift()!);
        }
      }
    }, []);
  
    const connect = useCallback(() => {
      if (ws.current) {
        ws.current.onopen = null;
        ws.current.onmessage = null;
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
      }
  
      manualClose.current = false;
      ws.current = new WebSocket(url);
      setReadyState(WebSocket.CONNECTING);
  
      ws.current.onopen = () => {
        retryCount.current = 0;
        setReadyState(WebSocket.OPEN);
        onOpen && onOpen();
        flushMessageQueue();
        sendHeartbeat();
      };
  
      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") return; // ignore pong heartbeat
        } catch {
          // Not JSON or no type property
        }
        onMessage && onMessage(event.data);
      };
  
      ws.current.onclose = (event: CloseEvent) => {
        setReadyState(WebSocket.CLOSED);
        onClose && onClose(event);
  
        if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);
  
        if (!manualClose.current) {
          if (retryCount.current < maxRetries) {
            const delay = Math.min(
              initialReconnectDelay * 2 ** retryCount.current,
              maxReconnectDelay
            );
            retryCount.current += 1;
            reconnectTimeout.current = setTimeout(connect, delay);
          } else {
            onError && onError(new Error("Max reconnect attempts reached"));
          }
        }
      };
  
      ws.current.onerror = (error: Event) => {
        onError && onError(error);
        if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
          ws.current.close();
        }
      };
    }, [
      url,
      onMessage,
      onOpen,
      onClose,
      onError,
      flushMessageQueue,
      sendHeartbeat,
      initialReconnectDelay,
      maxReconnectDelay,
      maxRetries,
    ]);
  
    useEffect(() => {
      connect();
  
      return () => {
        manualClose.current = true;
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);
        if (ws.current) ws.current.close();
      };
    }, [connect]);
  
    const sendMessage = useCallback((message: string) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(message);
      } else {
        messageQueue.current.push(message);
      }
    }, []);
  
    const close = useCallback(() => {
      manualClose.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);
      if (ws.current) ws.current.close();
    }, []);
  
    return { sendMessage, readyState, close };
  }
  
  export default useWebSocket;