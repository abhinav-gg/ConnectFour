'use client'

import React from 'react'
import Link from 'next/link'
import SinglePlayerGameboard from '@/components/singleplayer_gameboard'
import Dashboard from '@/components/dashboard'
import { GameState } from '@/utils/game'

export default function AboutUs() {
  return (
    <div className="lex min-h-screen bg-gray-100 flex">
      <Dashboard />
      <div className="flex-1 flex flex-col items-center pr-4 pl-7">
        <h1 className="text-4xl font-bold text-center mb-12">About Connect Four</h1>
        
        <div className="gap-12 mb-12 items-center">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-4 text-center">The Game</h2>
            <p className="mb-4 text-center">
              Connect Four is a two-player connection game in which the players first choose a color and then take turns dropping one colored disc from the top into a seven-column, six-row vertically suspended grid. The pieces fall straight down, occupying the lowest available space within the column. The objective of the game is to be the first to form a horizontal, vertical, or diagonal line of four of one's own discs.
            </p>
            <p className="mb-4 text-center">
              The game was first sold under the Connect Four trademark by Milton Bradley in February 1974.
            </p>
            <h3 className="text-xl font-semibold mb-2 text-center">Mathematical Solution</h3>
            <p className="text-center">
              Connect Four is a solved game. The first player can always win by playing the right moves. This was first published by James Dow Allen on October 1, 1988, and independently by Victor Allis in 1992. Allis also computed that the first player can force a win using 41 moves (with perfect play), while the second player can only force a win using 42 moves.
            </p>
          </div>
        </div>
        <br />
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">Try it out!</h2>
          <SinglePlayerGameboard ref={new GameState()}/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">About Me</h2>
            <p>
                My name is Abhinav and I have had a passion for game development for quite a while. I still remember launching my first 2D platformer with terrible graphics and physics in Year 10 of school and we had so much fun with it. I was inspired across the next few years by a friend who loved competitive games and we would spend hours trying to best each other at Connect Four but with no good online tool for improvement we were in a stalemate. Over the Summer after completing A levels I began working on this project using a Django backend which was a terrible idea for someone who had no experience in it, so invited another friend who is now my Co-Founder to help with the Typescript backend of the project.
            </p>
          </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">About The Team</h2>
      
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-2">Team Member 1</h3>
            <p>
              be me. CS and engineering student. also into law, specifically cybersecurity law. trying to be the perfect blend of nerd and aspiring solicitor. join law society for the ✨vibes✨. doing take-home CTF puzzles like it's a speedrun. tfw could complete all three puzzles but worried it’s “too much”. advent of code enjoyer, but secretly miss bubble tea. tfw Chatime isn't walking distance anymore. hear owl at night. decide to photograph it. owl never shows up. tfw it’s like a cryptid now. at least I'm getting a project done with a friend. tfw programming a web app but also wondering if copyright law will let me reboot a legal AI project. absolutely no one else is doing "Connect Four data storage optimization". tfw niche is life
            </p>
          </div>

          <div>
            <h3 className="text-xl font-medium mb-2">Team Member 2</h3>
            <p>
              Second Team Member
            </p>
          </div>
        </div>
      </div>
      <div className="text-center">
        <Link href="/" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
          Back to Home
        </Link>
      </div>
      <br/><br/><br/>
    </div>
    </div>
  )
}