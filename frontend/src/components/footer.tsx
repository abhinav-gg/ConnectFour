"use client"

import { Twitter, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer
      className="mt-auto border-t border-brand-border/20 bg-brand-secondary/50 backdrop-blur-sm"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <nav aria-label="Footer navigation">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap gap-4 lg:gap-6 text-sm text-brand-text-muted justify-center lg:justify-start">
              <a
                href="#"
                className="hover:text-white focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded px-1 transition-all"
              >
                Topic
              </a>
              <a
                href="#"
                className="hover:text-white focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded px-1 transition-all"
              >
                Page
              </a>
              <a
                href="#"
                className="hover:text-white focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded px-1 transition-all"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-white focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded px-1 transition-all"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-white focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded px-1 transition-all"
              >
                Privacy Settings
              </a>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-white font-bold text-lg">Con4.UK</span>

              <div className="flex gap-4" role="group" aria-label="Social media links">
                <a
                  href="#"
                  aria-label="Follow us on Twitter"
                  className="focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded"
                >
                  <Twitter className="w-5 h-5 text-brand-text-muted hover:text-white focus:text-white cursor-pointer transition-colors" />
                </a>
                <a
                  href="#"
                  aria-label="Follow us on Discord"
                  className="focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded"
                >
                  <div className="w-5 h-5 bg-brand-text-muted hover:bg-white focus:bg-white rounded cursor-pointer transition-colors" />
                </a>
                <a
                  href="#"
                  aria-label="Follow us on Instagram"
                  className="focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded"
                >
                  <Instagram className="w-5 h-5 text-brand-text-muted hover:text-white focus:text-white cursor-pointer transition-colors" />
                </a>
                <a
                  href="#"
                  aria-label="Follow us on TikTok"
                  className="focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded"
                >
                  <div className="w-5 h-5 bg-brand-text-muted hover:bg-white focus:bg-white rounded cursor-pointer transition-colors" />
                </a>
                <a
                  href="#"
                  aria-label="Subscribe to our YouTube channel"
                  className="focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded"
                >
                  <Youtube className="w-5 h-5 text-brand-text-muted hover:text-white focus:text-white cursor-pointer transition-colors" />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 lg:gap-6 text-sm text-brand-text-muted justify-center lg:justify-end">
              <a
                href="#"
                className="hover:text-white focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded px-1 transition-all"
              >
                Topic
              </a>
              <a
                href="#"
                className="hover:text-white focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded px-1 transition-all"
              >
                Partners
              </a>
              <a
                href="#"
                className="hover:text-white focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-brand-secondary rounded px-1 transition-all"
              >
                Fair Play
              </a>
            </div>
          </div>
        </nav>
      </div>
    </footer>
  )
}
