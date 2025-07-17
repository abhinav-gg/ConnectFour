"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "./sidebar"
import { Footer } from "./footer"
import { Menu } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}


export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarLeftPadding, setSidebarLeftPadding] = useState(-3)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      
      const mobile = window.innerWidth < 768 // md breakpoint
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(true) // Start collapsed on mobile
        setSidebarOpen(false)
        setSidebarLeftPadding(20) // No padding on mobile
      }
      else {
        setSidebarLeftPadding(!sidebarCollapsed ? 168 : 68) // Set padding based on collapsed state
      }

    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
      setSidebarLeftPadding(sidebarOpen ? 20 : 268) // Set padding based on collapsed state

    } else {
      setSidebarCollapsed(!sidebarCollapsed)
      setSidebarLeftPadding(sidebarCollapsed ? 168 : 68) // Set padding based on collapsed state

    }
  }

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false)
      setSidebarLeftPadding(20)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-brand-primary to-brand-secondary">
      
      {/* Sidebar Toggle Button */}
      <button
            onClick={toggleSidebar}
            className="fixed top-4 z-[60] bg-brand-hover hover:bg-brand-primary text-white border-0 shadow-md rounded-lg p-2 transition-all duration-200 hover:shadow-lg focus:ring-2 focus:ring-white/50 focus:ring-offset-brand-primary"
            style={{ left: sidebarLeftPadding }}
            aria-label="Toggle sidebar"
          >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={closeMobileSidebar} />
      )}

      {/* Desktop Sidebar - Only render on desktop */}
      {!isMobile && (
        <AppSidebar collapsed={sidebarCollapsed} isMobile={false} isOpen={false} onClose={closeMobileSidebar} />
      )}

      {/* Mobile Sidebar - Rendered as portal/overlay */}
      {isMobile && <AppSidebar collapsed={false} isMobile={true} isOpen={sidebarOpen} onClose={closeMobileSidebar} />}

      {/* Main Content Area - Full width on mobile, adjusted width on desktop */}
      <div className="flex-1 flex flex-col text-white relative min-w-0">
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-7xl">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
