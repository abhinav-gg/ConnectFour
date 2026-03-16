"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"

// ─── GOOGLE ADSENSE CONFIGURATION ────────────────────────────────────────────
// Replace these with your real AdSense publisher ID and ad slot ID.
// Publisher ID format:  ca-pub-XXXXXXXXXXXXXXXX
// Ad Slot ID format:    XXXXXXXXXX (10-digit number)
const ADSENSE_CLIENT = "ca-pub-0000000000000000"   // <-- replace with real publisher ID
const ADSENSE_SLOT   = "0000000000"                // <-- replace with real ad slot ID
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function AdPlaceholder() {
  useEffect(() => {
    try {
      // Push a new ad unit once the component mounts.
      // AdSense script must be loaded in app/layout.tsx for this to work:
      //   <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous" />
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense not loaded in this environment — fallback placeholder shown below.
    }
  }, [])

  return (
    <motion.div
      className="w-40 flex-shrink-0 hidden md:flex flex-col"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.35 }}
    >
      {/*
        ── GOOGLE AD UNIT ──────────────────────────────────────────────────────
        When AdSense is active the <ins> tag will be filled automatically.
        The fallback div below is shown only in dev / when AdSense is not loaded.
        ────────────────────────────────────────────────────────────────────────
      */}
      <ins
        className="adsbygoogle block rounded-xl overflow-hidden min-h-[400px] h-full"
        style={{ display: "block", minHeight: 400 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="false"
      />

      {/* Fallback shown only when AdSense hasn't filled the slot */}
      <noscript>
        <div className="bg-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 text-sm font-semibold text-center min-h-[400px] h-full select-none">
          <span className="text-xs uppercase tracking-widest text-gray-400 mb-2">Ad</span>
          <span>Advertisement</span>
        </div>
      </noscript>
    </motion.div>
  )
}
