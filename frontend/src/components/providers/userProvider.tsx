'use client';

import { myConfig } from '@/config/env';
import { UserProfile } from '@shared/types/users';
import { useSocketContext } from './SocketProvider';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { useError } from './errorProvider';

interface LocalUser extends UserProfile {
  cachedAt: number;
}

interface UserContextValue {
  user: LocalUser | null;
  isAnonymous: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

const CACHE_KEY = 'userInfo';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Holds current refreshUser function instance for external calls
let externalRefreshUser: (() => Promise<void>) | null = null;

export const refreshUserExternally = async () => {
  if (externalRefreshUser) {
    await externalRefreshUser();
  } else {
    console.warn('UserProvider not mounted yet');
  }
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const fetchingRef = useRef(false);
  const { onMessage, onPrefixedMessage, onError } = useSocketContext();
  const { showError } = useError();

  useEffect(() => {
    // Register error logging
    onError((error) => {
      console.error('Socket error:', error);
    });
  }, [onMessage, onPrefixedMessage, onError]);
    

  const fetchAndSetUser = useCallback(async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    console.log('Fetching user data...');
    try {
      const res = await fetch(`${myConfig.BACKEND_URL}/auth/me`, {
        credentials: 'include',
      });
      if (!res.ok) {
        
        // this is actually a really bad error, we should not be here
        throw new Error('Failed to fetch user data');
      }

      const data = await res.json();

      if (data?.username) {
        const userData: LocalUser = {
          username: data.username,
          pfp: data.pfp || '/icons/user.svg',
          cachedAt: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(userData));
        setUser(userData);
      } else {
        setUser(null);
        localStorage.removeItem(CACHE_KEY);
      }
    } catch {
      showError('Backend Failure. Please try again later.', 'error', -1);
      setUser(null);
      localStorage.removeItem(CACHE_KEY);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    externalRefreshUser = fetchAndSetUser;
    return () => {
      externalRefreshUser = null;
    };
  }, [fetchAndSetUser]);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: LocalUser = JSON.parse(cached);
      const isValid = Date.now() - parsed.cachedAt < CACHE_TTL;
      if (isValid) {
        setUser(parsed);
        
        return;
      }
      localStorage.removeItem(CACHE_KEY);
    }
    fetchAndSetUser();
  }, [fetchAndSetUser]);

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(CACHE_KEY);
  };

  const isAnonymous = user?.username === 'Anonymous';

  return (
    <UserContext.Provider
      value={{ user, isAnonymous, logout, refreshUser: fetchAndSetUser }}
    >
      {children}
    </UserContext.Provider>
  );
};
