"use client"

import type React from "react"
import { AccountSettings } from "./account"

interface SettingsContentProps {
  activeSection: string
}

const contentMap: Record<string, { title: string; description: string; component: React.ComponentType }> = {
  account: {
    title: "Account",
    description: "Change your password, update contact info and view connected accounts",
    component: AccountSettings,
  },
  gameplay: {
    title: "Gameplay",
    description: "Customize your gameplay experience and preferences",
    component: () => <div className="text-brand-text-light">Gameplay settings coming soon</div>,
  },
  profile: {
    title: "Profile",
    description: "Update your profile information",
    component: () => <div className="text-brand-text-light">Profile settings coming soon</div>,
  },
  notifications: {
    title: "Notifications",
    description: "Manage your notification preferences",
    component: () => <div className="text-brand-text-light">Notification settings coming soon</div>,
  },
  membership: {
    title: "Membership",
    description: "Manage your membership and subscription",
    component: () => <div className="text-brand-text-light">Membership settings coming soon</div>,
  },
  accessibility: {
    title: "Accessibility",
    description: "Accessibility options and preferences",
    component: () => <div className="text-brand-text-light">Accessibility settings coming soon</div>,
  },
}

export function SettingsContent({ activeSection }: SettingsContentProps) {
  const content = contentMap[activeSection]
  if (!content) return null

  const Component = content.component

  return (
    <div className="flex-1 p-12 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white mb-2">{content.title}</h2>
        <p className="text-brand-text-light">{content.description}</p>
      </div>

      <div className="mt-6">
        <Component />
      </div>
    </div>
  )
}
