'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/BackendProvider';
import Loading from '../loading';

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectUrl?: string;
}

/**
 * AuthGuard ensures the component is only rendered if the user is fully authenticated (not anonymous).
 * If unauthenticated or anonymous, it redirects to /auth/login.
 */
export function AuthGuard({ children, fallback = <Loading />, redirectUrl = '/auth/login' }: GuardProps) {
  const { isAuthenticated, isFetchingUser } = useUser();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isFetchingUser) {
      if (isAuthenticated) {
        setShouldRender(true);
      } else {
        router.push(redirectUrl);
      }
    }
  }, [isAuthenticated, isFetchingUser, router, redirectUrl]);

  if (isFetchingUser || !shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * GuestGuard ensures the component is only rendered if the user is NOT fully authenticated (e.g. login/register pages).
 * If authenticated, it redirects to /profile.
 */
export function GuestGuard({ children, fallback = <Loading />, redirectUrl = '/profile' }: GuardProps) {
  const { isAuthenticated, isFetchingUser } = useUser();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isFetchingUser) {
      if (!isAuthenticated) {
        setShouldRender(true);
      } else {
        router.push(redirectUrl);
      }
    }
  }, [isAuthenticated, isFetchingUser, router, redirectUrl]);

  if (isFetchingUser || !shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * NonAnonymousGuard is an intermediate guard that allows rendering if the user has an actual account,
 * or allows checking specifically if you want to enforce avoiding strictly anonymous users. 
 * Often AuthGuard already covers this (since isAuthenticated tends to imply !isAnonymous).
 */
export function NonAnonymousGuard({ children, fallback = <Loading />, redirectUrl = '/auth/login' }: GuardProps) {
  const { isAnonymous, isFetchingUser } = useUser();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isFetchingUser) {
      if (!isAnonymous) {
        setShouldRender(true);
      } else {
        router.push(redirectUrl);
      }
    }
  }, [isAnonymous, isFetchingUser, router, redirectUrl]);

  if (isFetchingUser || !shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
