import { useEffect, useRef, useState, useCallback } from "react";

export const WEBSOCKET_DEFAULTS = {
  maxRetries: 5,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 60000,
};

interface UseWebSocketOptions {
  onMessage?: (json: any) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event | Error) => void;
  maxRetries?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
}

interface UseWebSocketResult {
  sendJson: (data: object) => void;
  readyState: number;
  close: () => void;
  getLastJson: () => any | null;
}

function useWebSocket(url: string, options: UseWebSocketOptions = {}): UseWebSocketResult {
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
  const messageQueue = useRef<object[]>([]);
  const lastJsonRef = useRef<any | null>(null);
  const manualClose = useRef(false);

  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);

  const sendHeartbeat = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({ type: "ping" }));
      } catch {}
    }
    heartbeatTimeout.current = setTimeout(sendHeartbeat, heartbeatInterval);
  }, [heartbeatInterval]);

  const flushMessageQueue = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      while (messageQueue.current.length > 0) {
        const msg = messageQueue.current.shift();
        if (msg) {
          try {
            ws.current.send(JSON.stringify(msg));
          } catch (err) {
            console.error("Failed to send queued JSON:", err);
          }
        }
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
      onOpen?.();
      flushMessageQueue();
      sendHeartbeat();
    };

    ws.current.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "pong") return;
        lastJsonRef.current = data;
        onMessage?.(data);
      } catch {
        // Ignore malformed JSON
      }
    };

    ws.current.onclose = (event: CloseEvent) => {
      setReadyState(WebSocket.CLOSED);
      onClose?.(event);
      if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);

      if (!manualClose.current && retryCount.current < maxRetries) {
        const delay = Math.min(initialReconnectDelay * 2 ** retryCount.current, maxReconnectDelay);
        retryCount.current += 1;
        reconnectTimeout.current = setTimeout(connect, delay);
      } else if (retryCount.current >= maxRetries) {
        onError?.(new Error("Max reconnect attempts reached"));
      }
    };

    ws.current.onerror = (event: Event) => {
      onError?.(event);
      if (ws.current?.readyState !== WebSocket.CLOSED) {
        ws.current!.close();
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
      ws.current?.close();
    };
  }, [connect]);

  const sendJson = useCallback((data: object) => {
    try {
      const jsonString = JSON.stringify(data);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(jsonString);
      } else {
        messageQueue.current.push(data);
      }
    } catch (err) {
      console.error("Failed to send JSON message:", err);
    }
  }, []);

  const close = useCallback(() => {
    manualClose.current = true;
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);
    ws.current?.close();
  }, []);

  const getLastJson = useCallback(() => lastJsonRef.current, []);

  return { sendJson, readyState, close, getLastJson };
}

export default useWebSocket;
