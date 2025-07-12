"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "./sidebar"
import { Footer } from "./footer"
import { Menu } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
  showHeader?: boolean
}

export function Layout({ children, showHeader = true }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 // md breakpoint
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(true) // Start collapsed on mobile
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      console.log({
        sidebarCollapsed,
        isMobile,
        sidebarOpen,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sidebarCollapsed, isMobile, sidebarOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-brand-primary to-brand-secondary">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={closeMobileSidebar} />
      )}

      {/* Sidebar */}
      <AppSidebar collapsed={sidebarCollapsed} isMobile={isMobile} isOpen={sidebarOpen} onClose={closeMobileSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col text-white relative">
        {showHeader && (
          <header className="flex items-center gap-4 px-4 py-3 border-b border-brand-border/20 bg-brand-primary/50 backdrop-blur-sm">
            {/* Sidebar Toggle Button - On main content area */}
            <button
              onClick={toggleSidebar}
              className="bg-brand-hover hover:bg-brand-primary text-white border-0 shadow-md rounded-lg p-2 transition-all duration-200 hover:shadow-lg focus:ring-2 focus:ring-white/50 focus:ring-offset-brand-primary"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Con4 Logo */}
            <a href="/home" className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                <div className="absolute top-0 left-0 w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
              <span className="text-xl font-bold text-white">Con4</span>
            </a>
          </header>
        )}

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-7xl">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
