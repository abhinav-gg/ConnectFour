"use client"

import { Button } from "@/components/ui/button"
import { Gamepad2, Bot } from "lucide-react"
import { useState, useEffect } from "react"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { Layout } from "@/components/mainlayout"
import { Board } from "@/components/boards/Board"


export default function Component() {
  // Connect 4 board component
  // Remove the existing Connect4Board component definition and replace with:

  // Then in the component, replace all Connect4Board usages:

  const [showSecurityModal, setShowSecurityModal] = useState(false)

  return (
    <Layout>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 bg-brand-accent-orange text-white px-4 py-2 rounded z-50 focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Hero Section */}
      <section id="main-content" className="py-8" aria-labelledby="hero-heading">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="flex justify-center lg:justify-start">
            <Board ariaLabel="Large Connect 4 game board showing empty game grid" />
          </div>

          <div className="space-y-8">
            <div>
              <h1 id="hero-heading" className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-6">
                Play the game of the mind
                <br />
                on the best online site!
              </h1>

              <div className="flex gap-8 text-sm text-brand-text-muted mb-8" role="group" aria-label="Game statistics">
                <div>
                  <span className="text-white font-semibold">+100,000</span> Games Today
                </div>
                <div>
                  <span className="text-white font-semibold">+100,000</span> Playing Now
                </div>
              </div>
            </div>

            <nav aria-label="Game mode selection">
              <div className="space-y-4">
                <button
                  className="flex items-center gap-4 bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-primary rounded-xl p-4 w-full text-left transition-all"
                  onClick={() => setShowSecurityModal(true)}
                  aria-describedby="play-online-description"
                >
                  <Gamepad2 className="w-8 h-8" aria-hidden="true" />
                  <div>
                    <div className="font-semibold">Play Online</div>
                    <div id="play-online-description" className="text-sm text-brand-text-muted">
                      Play with anyone at your level
                    </div>
                  </div>
                </button>

                <button className="flex items-center gap-4 bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-primary rounded-xl p-4 w-full text-left transition-all">
                  <Bot className="w-8 h-8" aria-hidden="true" />
                  <div>
                    <div className="font-semibold">Play Computer</div>
                    <div className="text-sm text-brand-text-muted">Play vs customizable training bots</div>
                  </div>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </section>

      {/* Solve Puzzles Section */}
      <section className="py-16" aria-labelledby="puzzles-heading">
        <div className="bg-brand-secondary rounded-3xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 id="puzzles-heading" className="text-3xl lg:text-4xl font-bold mb-8">
                Solve Puzzles
              </h2>
              <Button className="bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-secondary text-white px-8 py-3 rounded-xl mb-8 transition-all">
                Solve Puzzles
              </Button>
              <p className="text-brand-text-muted text-lg leading-relaxed">
                Solve some very cool AI
                <br />
                generated connect four puzzles
                <br />
                to increase your rating.. and ego.
              </p>
            </div>

            <div className="flex justify-center">
              <Board ariaLabel="Connect 4 puzzle board for solving challenges" />
            </div>
          </div>
        </div>
      </section>

      {/* Watch Live Section */}
      <section className="py-16" aria-labelledby="watch-heading">
        <div className="bg-brand-secondary rounded-3xl p-8 lg:p-12">
          <h2 id="watch-heading" className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Watch Live
          </h2>

          <div
            className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12"
            role="group"
            aria-label="Live game boards"
          >
            <Board ariaLabel="Live game board 1 - ongoing match" />
            <Board ariaLabel="Live game board 2 - ongoing match" />
          </div>

          <div className="text-center">
            <Button className="bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-secondary text-white px-8 py-3 rounded-xl transition-all">
              See Current games
            </Button>
          </div>
        </div>
      </section>

      {/* Learn Connect 4 Section */}
      <section className="py-16" aria-labelledby="learn-heading">
        <div className="bg-brand-secondary rounded-3xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="flex justify-center order-2 lg:order-1">
              <Board ariaLabel="Connect 4 tutorial board for learning the game" />
            </div>

            <div className="order-1 lg:order-2">
              <h2 id="learn-heading" className="text-3xl lg:text-4xl font-bold mb-8">
                Learn Connect 4
              </h2>
              <Button className="bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-secondary text-white px-8 py-3 rounded-xl transition-all">
                Learn Connect 4
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
