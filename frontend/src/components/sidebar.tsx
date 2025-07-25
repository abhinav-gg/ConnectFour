"use client"

import type React from "react"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { Play, Puzzle, GraduationCap, Wrench, Calendar, Users, Bell, Settings } from "lucide-react"

// Tooltip Portal Component
function TooltipPortal({
  children,
  show,
  position,
}: { children: React.ReactNode; show: boolean; position: { x: number; y: number } }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !show) return null

  return createPortal(
    <div className="fixed pointer-events-none z-[9999]" style={{ left: position.x, top: position.y }}>
      {children}
    </div>,
    document.body,
  )
}

const navigationItems = [
  {
    title: "Play",
    icon: Play,
    url: "#play",
  },
  {
    title: "Puzzle",
    icon: Puzzle,
    url: "#puzzle",
  },
  {
    title: "Learn",
    icon: GraduationCap,
    url: "#coming-soon",
  },
  {
    title: "Tools",
    icon: Wrench,
    url: "#tools",
  },
  {
    title: "Events",
    icon: Calendar,
    url: "#events",
  },
  {
    title: "Community",
    icon: Users,
    url: "community",
  },
  {
    title: "Notifications",
    icon: Bell,
    url: "#notifications",
    hasNotification: true,
  },
  {
    title: "Settings",
    icon: Settings,
    url: "#settings",
  },
]

interface AppSidebarProps {
  collapsed?: boolean
  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

export function AppSidebar({ collapsed = false, isMobile = false, isOpen = false, onClose }: AppSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  const handleMouseEnter = (itemTitle: string, event: React.MouseEvent) => {
    if (collapsed && !isMobile) {
      const rect = event.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.right + 8,
        y: rect.top + rect.height / 2 - 16,
      })
      setHoveredItem(itemTitle)
    }
  }

  const handleMouseLeave = () => {
    setHoveredItem(null)
  }

  return (
    <aside
      className={`
  ${
    isMobile
      ? `fixed left-0 top-0 h-screen w-0 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0 !w-64" : "-translate-x-full"
        } overflow-hidden`
      : `${collapsed ? "w-12" : "w-40"} transition-all duration-300 ease-in-out h-screen sticky top-0`
  }
  bg-gradient-to-b from-brand-primary to-brand-secondary
  ${!isMobile ? "border-r border-brand-border" : "shadow-2xl"}
  flex flex-col
`}
      aria-label="Main navigation"
    >
      {/* Header - Fixed */}
      <div className={`${collapsed && !isMobile ? "p-2" : "p-3"} border-b border-brand-border flex-shrink-0`}>
        <a
          href="/home"
          className={`flex items-center ${collapsed && !isMobile ? "justify-center" : "gap-2"} group relative`}
          onClick={handleLinkClick}
          onMouseEnter={(e) => handleMouseEnter("Con4 Home", e)}
          onMouseLeave={handleMouseLeave}
        >
          {/* Con4 Logo */}
          <div className={`relative ${collapsed && !isMobile ? "w-6 h-6" : "w-7 h-7"} flex-shrink-0`}>
            <div
              className={`absolute top-0 left-0 ${collapsed && !isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} bg-brand-accent-red rounded-full`}
            ></div>
            <div
              className={`absolute top-0 right-0 ${collapsed && !isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} bg-brand-accent-yellow rounded-full`}
            ></div>
            <div
              className={`absolute bottom-0 left-0 ${collapsed && !isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} bg-brand-accent-yellow rounded-full`}
            ></div>
            <div
              className={`absolute bottom-0 right-0 ${collapsed && !isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} bg-brand-accent-red rounded-full`}
            ></div>
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-lg font-bold text-white transition-opacity duration-300">Con4</span>
          )}
        </a>
      </div>

      {/* Navigation Content - Scrollable on mobile if needed */}
      <div className={`flex-1 px-1 py-2 flex flex-col justify-start min-h-0 ${isMobile ? "overflow-y-auto" : ""}`}>
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <a
              key={item.title}
              href={item.url}
              onClick={handleLinkClick}
              onMouseEnter={(e) => handleMouseEnter(item.title, e)}
              onMouseLeave={handleMouseLeave}
              className={`
                flex items-center relative
                ${collapsed && !isMobile ? "justify-center px-1 py-2 mx-1" : "gap-3 px-3 py-2"}
                text-white hover:bg-brand-hover focus:bg-brand-hover 
                rounded-lg transition-all duration-200
                focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-brand-primary
                group
              `}
            >
              <item.icon className={`${collapsed && !isMobile ? "h-4 w-4" : "h-4 w-4"} flex-shrink-0`} />
              {(!collapsed || isMobile) && (
                <span className="text-sm transition-opacity duration-300">{item.title}</span>
              )}
              {item.hasNotification && (
                <div
                  className={`
                    absolute w-2 h-2 bg-brand-notification rounded-full
                    ${collapsed && !isMobile ? "top-0.5 right-0.5" : "top-2 right-3"}
                    transition-all duration-300
                  `}
                />
              )}
            </a>
          ))}
        </nav>
      </div>

      {/* Profile Section - Fixed at bottom */}
      <div className={`${collapsed && !isMobile ? "p-2" : "p-3"} border-t border-brand-border flex-shrink-0`}>
        <button
          className={`
            flex items-center w-full relative
            ${collapsed && !isMobile ? "justify-center p-1.5" : "gap-2 p-2"}
            text-white hover:bg-brand-hover focus:bg-brand-hover 
            rounded-lg transition-all duration-200
            focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-brand-primary
            group
          `}
          onClick={handleLinkClick}
          onMouseEnter={(e) => handleMouseEnter("Profile", e)}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`${collapsed && !isMobile ? "w-6 h-6" : "w-7 h-7"} rounded-full overflow-hidden bg-brand-accent-yellow flex-shrink-0`}
          >
            <img src="/user.svg?height=28&width=28" alt="Profile" className="w-full h-full object-cover" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-sm font-medium transition-opacity duration-300">Profile</span>
          )}
        </button>
      </div>

      {/* Tooltip Portal - Only show on desktop when collapsed */}
      {!isMobile && (
        <TooltipPortal show={hoveredItem !== null} position={tooltipPosition}>
          <div className="px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg border border-gray-700 whitespace-nowrap">
            {hoveredItem}
          </div>
        </TooltipPortal>
      )}
    </aside>
  )
}
