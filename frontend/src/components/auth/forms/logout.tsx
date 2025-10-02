"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authApi } from "@/utils/apiClient";

export function LogoutUser() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        console.log('🔐 Logging out user...');
        const response = await authApi.logout();
        
        if (!response.success) {
          console.error('🔐 Logout error:', response.error);
        } else {
          console.log('🔐 Logout successful');
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