'use client';

import { UserProfile } from '@shared/types/users';
import { useSocketContext } from './SocketProvider';
import { useError } from './ErrorProvider';
import { authApi } from '@/utils/apiClient';
import { logger } from '@/utils/logger';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Swords } from "lucide-react";

interface LocalUser extends UserProfile {
  cachedAt: number;
}

interface GameSessionContextType {
  joinGame: (shortcode: string) => void;
  leaveGame: () => void;
  isInGame: boolean;
  currentShortcode: string | null;
}

interface BackendContextValue extends GameSessionContextType {
  user: LocalUser | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isFetchingUser: boolean;
  isMaintenanceMode: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const BackendContext = createContext<BackendContextValue | undefined>(undefined);

const CACHE_KEY = 'userInfo';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Holds current refreshUser function instance for external calls
let externalRefreshUser: (() => Promise<void>) | null = null;

export const refreshUserExternally = async () => {
  if (externalRefreshUser) {
    await externalRefreshUser();
  } else {
    console.warn('BackendProvider not mounted yet');
  }
};

// Return to Game Popup Component
function ReturnToGamePopup({
  shortcode,
  onReturn,
  onDismiss,
}: {
  shortcode: string;
  onReturn: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      className="fixed bottom-4 right-4 z-[99999] cursor-pointer select-none w-80 max-w-[calc(100vw-2rem)]"
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.4,
      }}
      onClick={onReturn}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl px-8 py-6 shadow-2xl border border-red-400/30 backdrop-blur-sm relative">
        <div className="flex items-center gap-6">
          <motion.div 
            className="flex-shrink-0"
            animate={{ 
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Swords className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col min-w-0 flex-1"
            animate={{ 
              opacity: [1, 0.8, 1],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <div className="text-xl font-bold leading-tight mb-1">Active Game!</div>
            <div className="text-base opacity-90 leading-tight break-all">Room: {shortcode}</div>
            <div className="text-sm opacity-75 mt-1">Click to return to game</div>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-3 -right-3 w-8 h-8 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg text-lg font-bold"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          title="Dismiss notification"
        >
          ×
        </motion.button>
      </div>
    </motion.div>
  );
}

interface BackendProviderProps {
  children: ReactNode;
}

export const BackendProvider = ({ children }: BackendProviderProps) => {
  // User state
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const fetchingRef = useRef(false);

  // Game session state
  const currentShortcodeRef = useRef<string | null>(null);
  const isInGameRef = useRef(false);
  const hasLeftRef = useRef(false);
  const [showReturnPopup, setShowReturnPopup] = useState(false);
  const [returnGameShortcode, setReturnGameShortcode] = useState<string | null>(null);
  const [, forceUpdate] = useState({});

  // Hooks
  const { sendJson, connected, unsubscribePrefixedMessage, onPrefixedMessage, onError } = useSocketContext();
  const { showError, showWarning, showInfo } = useError();
  const router = useRouter();
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  // System maintenance event handlers (from userProvider)
  useEffect(() => {
    onPrefixedMessage('system', (event, data) => {
      logger.socket(`System event: ${event}`, data);
      
      switch (event) {
        case 'maintenance':
          setIsMaintenanceMode(true);
          showError(
            data.message || 'System is currently under maintenance. Please try again later.',
            'warning',
            0
          );
          break;
          
        case 'online':
          setIsMaintenanceMode(false);
          showInfo(
            data.message || 'System is back online',
            5
          );
          break;
          
        case 'disconnecting':
          showWarning(
            data.message || 'Server is restarting. Please reconnect shortly.',
            0
          );
          break;
          
        default:
          logger.socket(`Unknown system event: ${event}`, data);
      }
    });

    // Socket error handling (from userProvider)
    onError((error) => {
      console.error('Socket error:', error);
      
      const errorWithData = error as any;
      if (error.message?.includes('maintenance') || errorWithData.data?.code === 'MAINTENANCE_MODE') {
        setIsMaintenanceMode(true);
        showError(
          errorWithData.data?.message || 'System is under maintenance. Please try again later.',
          'warning',
          0
        );
      }
    });
  }, [onPrefixedMessage, onError, showError, showWarning, showInfo]);

  // User data fetching (from userProvider)
  const fetchAndSetUser = useCallback(async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setIsFetchingUser(true);
    logger.auth('Fetching user data...');
    try {
      const response = await authApi.get<{ user: any }>('/me');
      
      logger.auth('User data response:', response);
      
      if (response.success && response.data?.user?.username) {
        const u = response.data.user || response.data;
        const userData: LocalUser = {
          username: u.username,
          pfp: u.pfp || '/icons/user.svg',
          isAnonymous: u.isAnonymous,
          isAuthenticated: u.isAuthenticated,
          provider: u.provider,
          cachedAt: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(userData));
        setUser(userData);
      } else {
        setUser(null);
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (error) {
      console.error('User fetch error:', error);
      showError('Maintenance Break. Please come back later.', 'error', -1);
      setUser(null);
      localStorage.removeItem(CACHE_KEY);
    } finally {
      fetchingRef.current = false;
      setIsFetchingUser(false);
    }
  }, [showError]);

  // Register external refresh function
  useEffect(() => {
    externalRefreshUser = fetchAndSetUser;
    return () => {
      externalRefreshUser = null;
    };
  }, [fetchAndSetUser]);

  // Load cached user data and fetch fresh data
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: LocalUser = JSON.parse(cached);
        const isValid = Date.now() - parsed.cachedAt < CACHE_TTL;
        if (isValid) {
          setUser(parsed);
          setIsFetchingUser(false);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }
    fetchAndSetUser();
  }, [fetchAndSetUser]);

  // Game session management (existing logic preserved)
  const leaveGame = useCallback(() => {
    if (currentShortcodeRef.current && !hasLeftRef.current && connected) {
      logger.game('BACKEND: Leaving game:', currentShortcodeRef.current);
      sendJson("matchmaking:leave", { shortcode: currentShortcodeRef.current });
      unsubscribePrefixedMessage("matchmaking");
      unsubscribePrefixedMessage("game");
      hasLeftRef.current = true;
    }
    currentShortcodeRef.current = null;
    isInGameRef.current = false;
    
    forceUpdate({});
  }, [sendJson, connected, unsubscribePrefixedMessage]);

  const joinGame = useCallback((shortcode: string) => {
    leaveGame();
    
    currentShortcodeRef.current = shortcode;
    isInGameRef.current = true;
    hasLeftRef.current = false;
    
    setShowReturnPopup(false);
    setReturnGameShortcode(null);
    
    logger.game('BACKEND: Joining game:', shortcode);
    sendJson("matchmaking:join", { shortcode });
    
    forceUpdate({});
  }, [sendJson, leaveGame]);

  const leaveGameEntirely = useCallback(() => {
    logger.game('BACKEND: Leaving game entirely');
    leaveGame();
    setShowReturnPopup(false);
    setReturnGameShortcode(null);
  }, [leaveGame]);

  const handleReturnToGame = useCallback(() => {
    if (returnGameShortcode) {
      router.push(`/game?r=${returnGameShortcode}`);
      setShowReturnPopup(false);
    }
  }, [returnGameShortcode, router]);

  const handleDismissPopup = useCallback(() => {
    logger.game('BACKEND: User dismissed return popup - leaving game entirely');
    setShowReturnPopup(false);
    setReturnGameShortcode(null);
    leaveGame();
  }, [leaveGame]);

  // Game session cleanup on navigation
  useEffect(() => {
    const handleBeforeUnload = () => leaveGame();
    const handlePageHide = () => leaveGame();

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      leaveGame();
    };
  }, [leaveGame]);

  // Route change detection for game sessions
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      logger.info('BACKEND: Route change detected:', prevPathnameRef.current, '->', pathname);

      if (prevPathnameRef.current?.includes("/game") && !pathname.includes("/game")) {
        if (currentShortcodeRef.current && isInGameRef.current) {
                    logger.ui('BACKEND: Showing return popup for shortcode:', currentShortcodeRef.current);
          setReturnGameShortcode(currentShortcodeRef.current);
          setShowReturnPopup(true);
        }
      }

      if (pathname.includes("/game")) {
        setShowReturnPopup(false);
        setReturnGameShortcode(null);
      }

      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(CACHE_KEY);
  };

  const isAnonymous = user?.isAnonymous ?? true;
  const isAuthenticated = user?.isAuthenticated ?? false;

  const value: BackendContextValue = {
    // User context
    user,
    isAnonymous,
    isAuthenticated,
    isFetchingUser,
    isMaintenanceMode,
    logout,
    refreshUser: fetchAndSetUser,
    
    // Game session context
    joinGame,
    leaveGame: leaveGameEntirely,
    isInGame: isInGameRef.current,
    currentShortcode: currentShortcodeRef.current,
  };

  return (
    <BackendContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {showReturnPopup && returnGameShortcode && !pathname.includes("/game") && (
          <ReturnToGamePopup
            shortcode={returnGameShortcode}
            onReturn={handleReturnToGame}
            onDismiss={handleDismissPopup}
          />
        )}
      </AnimatePresence>
    </BackendContext.Provider>
  );
};

export const useBackend = (): BackendContextValue => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};

// Export legacy hooks for backward compatibility
export const useUser = () => {
  const { user, isAnonymous, isAuthenticated, isFetchingUser, isMaintenanceMode, logout, refreshUser } = useBackend();
  return { user, isAnonymous, isAuthenticated, isFetchingUser, isMaintenanceMode, logout, refreshUser };
};

export const useGameSession = () => {
  const { joinGame, leaveGame, isInGame, currentShortcode } = useBackend();
  return { joinGame, leaveGame, isInGame, currentShortcode };
};