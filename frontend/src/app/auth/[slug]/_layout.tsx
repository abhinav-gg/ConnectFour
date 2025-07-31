"use client"

import type React from "react"

import { Layout } from "@/components/layouts/mainlayout"
import Board from "@/components/boards/Board"
import { motion } from "framer-motion"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  // Connect 4 board component for the left side

  return (
    <Layout>
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-16 items-center">
            {/* Left side - Connect 4 Board - Only show on XL screens and up */}
            <div className="hidden xl:flex justify-center">
              <Board interactive={false} animate_init={false} />
            </div>

            {/* Right side - Auth Form Container */}
            <div className="w-full max-w-lg mx-auto xl:mx-0">
              <motion.div
                className="bg-brand-secondary rounded-3xl p-8 lg:p-10 shadow-2xl border border-brand-border/20 select-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
