"use client"

import { myConfig } from "@/config/env";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LogoutUser() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        const response = await fetch(`${myConfig.BACKEND_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          const errorJson = await response.json();
          console.error(errorJson);
        }
      } catch (e) {
        console.error(e);
      } finally {
        router.replace("/");
      }
    };
    logout();
  }, [router]);

  return <></>;
}