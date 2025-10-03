"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authApi } from "@/utils/apiClient";
import { logger, printl } from '@/utils/logger';

export function LogoutUser() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        logger.auth('Logging out user...');
        const response = await authApi.post<{ message: string }>('/logout');
        
        if (!response.success) {
          console.error('🔐 Logout error:', response.error);
        } else {
          logger.auth('Logout successful');
        }
      } catch (e) {
        console.error('🔐 Logout failed:', e);
      } finally {
        router.replace("/");
      }
    };
    logout();
  }, [router]);

  return <></>;
}