'use client';

import { myConfig } from '@/config/env';
import { UserProfile } from '@shared/types/users';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';

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

  const fetchAndSetUser = useCallback(async () => {
    try {
      const res = await fetch(`${myConfig.BACKEND_URL}/auth/me`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('User not authenticated');

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
      setUser(null);
      localStorage.removeItem(CACHE_KEY);
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
