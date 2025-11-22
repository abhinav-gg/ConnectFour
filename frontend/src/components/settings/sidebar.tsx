"use client"

import { Gamepad2, UserCircle, Bell, Lock, Crown, Eye } from "lucide-react"
import { motion } from "framer-motion"

interface SettingsSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const sections = [
  { id: "gameplay", label: "Gameplay", icon: Gamepad2 },
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: Lock },
  { id: "membership", label: "Membership", icon: Crown },
  { id: "accessibility", label: "Accessibility", icon: Eye },
]

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <aside className="relative w-72 bg-brand-primary/80 border-r border-brand-border/50 flex-shrink-0 overflow-hidden rounded-l-3xl">
      <div className="absolute top-0 bottom-0 right-0 w-px bg-white/20" aria-hidden="true" />

      <nav className="flex flex-col gap-4 py-10 px-6">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <motion.button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className="relative group flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              {isActive && (
                <>
                  <motion.span
                    layoutId="sidebar-active-bg"
                    className="absolute inset-y-0 inset-x-[-24px] rounded-2xl bg-white/10"
                    aria-hidden="true"
                    transition={{ type: "spring", stiffness: 250, damping: 30 }}
                  />
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute right-[-24px] top-2 bottom-2 w-1 rounded-full bg-white"
                    aria-hidden="true"
                    transition={{ type: "spring", stiffness: 250, damping: 30 }}
                  />
                </>
              )}

              <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? "text-white" : "text-brand-text-light group-hover:text-white"}`} />
              <span className={`text-lg font-medium ${isActive ? "text-white" : "text-brand-text-light group-hover:text-white"}`}>
                {section.label}
              </span>
            </motion.button>
          )
        })}
      </nav>
    </aside>
  )
}
