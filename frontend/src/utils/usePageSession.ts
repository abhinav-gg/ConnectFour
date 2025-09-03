import { useCallback, useRef, useEffect } from 'react';
import { useSocketContext } from '@/components/providers/SocketProvider';
import { usePathname } from 'next/navigation';

interface PageSessionConfig {
  sessionId: string | null;
  leaveEvent: string;
  leaveData?: any;
  unsubscribeEvents?: string[];
  onSessionEnd?: () => void;
  shouldShowReturnOption?: boolean;
  targetPath?: string; // path where this session is active
}

interface PageSessionHook {
  joinSession: (sessionId: string, additionalData?: any) => void;
  leaveSession: () => void;
  isInSession: boolean;
  currentSessionId: string | null;
}

export function usePageSession(config: PageSessionConfig): PageSessionHook {
  const { sendJson, connected, unsubscribePrefixedMessage } = useSocketContext();
  const pathname = usePathname();
  
  const sessionRef = useRef<string | null>(null);
  const hasLeftRef = useRef(false);
  const isInSessionRef = useRef(false);
  
  // Simple leave function with minimal dependencies
  const leaveSession = useCallback(() => {
    if (sessionRef.current && !hasLeftRef.current && connected) {
      console.log(`🔌 PAGE SESSION: Leaving ${config.leaveEvent}:`, sessionRef.current);
      
      // Send leave event with session data
      const leaveData = {
        ...config.leaveData,
        sessionId: sessionRef.current
      };
      sendJson(config.leaveEvent, leaveData);
      
      // Unsubscribe from events
      config.unsubscribeEvents?.forEach(event => {
        unsubscribePrefixedMessage(event);
      });
      
      hasLeftRef.current = true;
    }
    
    // Clear session state
    sessionRef.current = null;
    isInSessionRef.current = false;
    
    // Call optional cleanup only once
    if (!hasLeftRef.current) {
      config.onSessionEnd?.();
    }
  }, [sendJson, connected, unsubscribePrefixedMessage]);

  // Join session function
  const joinSession = useCallback((sessionId: string, additionalData?: any) => {
    // Leave any existing session first
    leaveSession();
    
    // Set new session
    sessionRef.current = sessionId;
    isInSessionRef.current = true;
    hasLeftRef.current = false;
    
    console.log(`🔌 PAGE SESSION: Joining ${config.leaveEvent}:`, sessionId);
    
    // You can customize join logic here if needed
    // For now, this is mainly for tracking
  }, [leaveSession]);

  // Auto-cleanup on navigation away from target path
  useEffect(() => {
    if (config.targetPath && !pathname.includes(config.targetPath) && isInSessionRef.current) {
      if (config.shouldShowReturnOption) {
        // Don't leave immediately, let parent handle return option
        console.log(`🔌 PAGE SESSION: Navigated away from ${config.targetPath}, session preserved for return`);
      } else {
        // Leave immediately
        leaveSession();
      }
    }
  }, [pathname, leaveSession]);

  // Cleanup on unmount and page unload - simplified
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionRef.current && !hasLeftRef.current) {
        leaveSession();
      }
    };
    
    const handlePageHide = () => {
      if (sessionRef.current && !hasLeftRef.current) {
        leaveSession();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      
      // Only leave if we haven't already left
      if (sessionRef.current && !hasLeftRef.current) {
        leaveSession();
      }
    };
  }, []); // Empty dependencies to prevent re-running

  return {
    joinSession,
    leaveSession,
    isInSession: isInSessionRef.current,
    currentSessionId: sessionRef.current,
  };
}
