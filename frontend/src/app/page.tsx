"use client"

import { Button } from "@/components/ui/button"
import { Gamepad2, Bot } from "lucide-react"
import { Layout } from "@/components/layouts/mainlayout"
import Board from "@/components/boards/Board"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"


export default function Component() {
  const router = useRouter()

  // Simple intersection observers with console logging - check if entirely in view
  const { ref: heroRef, inView: heroInView } = useInView({
    threshold: 0.75, // Component must be entirely in view
    triggerOnce: true,
    onChange: (inView) => {
      if (inView) console.log("Hero section came entirely into view")
    }
  })

  const { ref: puzzlesRef, inView: puzzlesInView } = useInView({
    threshold: 0.75, // Component must be entirely in view
    triggerOnce: true,
    onChange: (inView) => {
      if (inView) console.log("Puzzles section came entirely into view")
    }
  })

  const { ref: watchRef, inView: watchInView } = useInView({
    threshold: 0.75, // Component must be entirely in view
    triggerOnce: true,
    onChange: (inView) => {
      if (inView) console.log("Watch section came entirely into view")
    }
  })

  const { ref: learnRef, inView: learnInView } = useInView({
    threshold: 0.75, // Component must be entirely in view
    triggerOnce: true,
    onChange: (inView) => {
      if (inView) console.log("Learn section came entirely into view")
    }
  })

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
      <motion.section 
        ref={heroRef}
        id="main-content" 
        className="py-8 md:py-12 lg:py-16" 
        aria-labelledby="hero-heading"
        initial={{ opacity: 0 }}
        animate={{ opacity: heroInView ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="flex justify-center lg:justify-start w-full">
              {/* Board container with controlled dimensions */}
              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square">
                <Board
                  boardState={
                    [
                      [ 10, 10, 10, 10, 10, 10, 10],
                      [  0,  0,  0,  1, 10, 10, 10],
                      [  0, 10, 10,  1, 10,  1, 10],
                      [  0, 10, 10,  1,  1,  1,  1],
                      [  0,  0,  0, 10, 10,  1, 10],
                      [ 10, 10, 10, 10, 10, 10, 10],
                    ].map(row => row.map(cell => cell === -1 ? null : cell))
                  }
                  interactive={false} 
                  animate_init={true}
                  showLastMoveHighlight={false}
                  ariaLabel="Large Connect 4 game board showing empty game grid" 
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="space-y-8 lg:space-y-12">
              <div>
                <h1 id="hero-heading" className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 lg:mb-8">
                  Play the game of the mind
                  on the best online site!
                </h1>

                <div className="flex gap-8 text-sm md:text-base lg:text-lg text-brand-text-muted mb-8" role="group" aria-label="Game statistics">
                  <div>
                    <span className="text-white font-semibold">+100,000</span> Games Today
                  </div>
                  <div>
                    <span className="text-white font-semibold">+100,000</span> Playing Now
                  </div>
                </div>
              </div>

              <nav aria-label="Game mode selection">
                <div className="space-y-4 lg:space-y-6">
                  <button
                    className="flex items-center gap-4 bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-primary rounded-xl p-4 lg:p-6 w-full text-left transition-all"
                    aria-describedby="play-online-description"
                    onClick={() => router.push('/play')}
                  >
                    <Gamepad2 className="w-8 h-8 lg:w-10 lg:h-10" aria-hidden="true" />
                    <div>
                      <div className="font-semibold text-base md:text-lg lg:text-xl">Play Online</div>
                      <div id="play-online-description" className="text-sm md:text-base text-brand-text-muted">
                        Play with anyone at your level
                      </div>
                    </div>
                  </button>

                  <button 
                    className="flex items-center gap-4 bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-primary rounded-xl p-4 lg:p-6 w-full text-left transition-all"
                    onClick={() => router.push('/play/bots')}
                  >
                    <Bot className="w-8 h-8 lg:w-10 lg:h-10" aria-hidden="true" />
                    <div>
                      <div className="font-semibold text-base md:text-lg lg:text-xl">Play Computer</div>
                      <div className="text-sm md:text-base text-brand-text-muted">Play vs customizable training bots</div>
                    </div>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Solve Puzzles Section */}
      <motion.section 
        ref={puzzlesRef}
        className="py-12 md:py-16 lg:py-24" 
        aria-labelledby="puzzles-heading"
        initial={{ opacity: 0 }}
        animate={{ opacity: puzzlesInView ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:max-w-[1400px]">
          <div className="bg-brand-secondary rounded-3xl p-8 md:p-10 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div>
                <h2 id="puzzles-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 lg:mb-10">
                  Solve Puzzles
                </h2>
                <Button 
                  className="bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-secondary text-white px-8 py-3 md:py-4 text-base md:text-lg lg:text-xl rounded-xl mb-8 transition-all"
                  onClick={() => router.push('/puzzle')}
                >
                  Solve Puzzles
                </Button>
                <p className="text-brand-text-muted text-lg md:text-xl lg:text-2xl leading-relaxed">
                  Solve some very cool AI
                  <br />
                  generated connect four puzzles
                  <br />
                  to increase your rating.. and ego.
                </p>
              </div>

              <div className="flex justify-center w-full">
                <div className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square">
                  <Board 
                    boardState={
                    [
                      [-1, -1, -1, -1, -1, -1, -1],
                      [-1, -1, -1, -1, -1, -1, -1],
                      [-1, -1, -1,  1,  0, -1, -1],
                      [-1, -1,  0,  1,  1, -1, -1],
                      [-1, -1,  0,  1,  0,  0,  1],
                      [ 1,  1,  0,  1,  0,  0,  1],
                    ].map(row => row.map(cell => cell === -1 ? null : cell))
                    }
                    animate_init={puzzlesInView}
                    ariaLabel="Connect 4 puzzle board for solving challenges"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Watch Live Section */}
      <motion.section 
        ref={watchRef}
        className="py-12 md:py-16 lg:py-24" 
        aria-labelledby="watch-heading"
        initial={{ opacity: 0 }}
        animate={{ opacity: watchInView ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:max-w-[1400px]">
          <div className="bg-brand-secondary rounded-3xl p-8 md:p-10 lg:p-16">
            <h2 id="watch-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-10 lg:mb-16">
              Watch Live
            </h2>

            <div
              className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 mb-12 w-full max-w-6xl mx-auto"
              role="group"
              aria-label="Live game boards"
            >
              <div className="w-full max-w-xs md:max-w-sm lg:max-w-md aspect-square">
                <Board animate_init={watchInView} ariaLabel="Live game board 1 - ongoing match" className="w-full h-full" />
              </div>
              <div className="w-full max-w-xs md:max-w-sm lg:max-w-md aspect-square">
                <Board animate_init={watchInView} ariaLabel="Live game board 2 - ongoing match" className="w-full h-full" />
              </div>
            </div>

            <div className="text-center">
              <Button className="bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-secondary text-white px-8 py-3 md:py-4 text-base md:text-lg lg:text-xl rounded-xl transition-all">
                See Current games
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Learn Connect 4 Section */}
      <motion.section 
        ref={learnRef}
        className="py-12 md:py-16 lg:py-24" 
        aria-labelledby="learn-heading"
        initial={{ opacity: 0 }}
        animate={{ opacity: learnInView ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:max-w-[1400px]">
          <div className="bg-brand-secondary rounded-3xl p-8 md:p-10 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="flex justify-center order-2 lg:order-1 w-full">
                <div className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl aspect-square">
                  <Board animate_init={learnInView} ariaLabel="Connect 4 tutorial board for learning the game" className="w-full h-full" />
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <h2 id="learn-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 lg:mb-10">
                  Learn Connect 4
                </h2>
                <Button className="bg-brand-hover hover:bg-brand-primary focus:bg-brand-primary focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-secondary text-white px-8 py-3 md:py-4 text-base md:text-lg lg:text-xl rounded-xl transition-all">
                  Learn Connect 4
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </Layout>
  )
}
