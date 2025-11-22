"use client"

import { useState } from "react"
import { Layout } from "@/components/layouts/mainlayout"
import { SettingsSidebar } from "@/components/settings/sidebar"
import { SettingsContent } from "@/components/settings/content"
import { Settings } from "lucide-react"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account")

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full px-4 pt-12 flex flex-col h-full gap-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-8 h-8 text-white" aria-hidden="true" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        {/* Settings Container */}
        <div className="flex-1 bg-brand-primary rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex min-h-[620px]">
            {/* Sidebar */}
            <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

            {/* Content */}
            <SettingsContent activeSection={activeSection} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
