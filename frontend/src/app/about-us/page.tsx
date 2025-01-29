'use client';

import abhinav from "@/assets/8aw2oifj8a289.jpg";
import ivan from "@/assets/8e740a38d475.jpeg";
import avery from "@/assets/c7764b38e10a.jpg";
import Dashboard from '@/components/dashboard';
import SinglePlayerGameboard from '@/components/game/singleplayer_gameboard';
import { GameState } from '@shared/utils/game';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-100 flex w-full">
      <Dashboard />
      <div className="w-full flex flex-col items-center p-4">
        <div className="w-full max-w-6xl">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl p-8 mb-16 shadow-lg">
            <h1 className="text-5xl font-bold text-center mb-4">
              About Connect Four
            </h1>
            <p className="text-lg text-center text-blue-100 max-w-2xl mx-auto">
              A classic game of strategy and skill, reimagined for the digital age
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-semibold mb-4 text-blue-600">The Game</h2>
                <p className="text-gray-700 leading-relaxed">
                  Connect Four is a two-player connection game in which the players first choose a color and then take turns dropping one colored disc from the top into a seven-column, six-row vertically suspended grid. The pieces fall straight down, occupying the lowest available space within the column. The objective of the game is to be the first to form a horizontal, vertical, or diagonal line of four of one's own discs.
                </p>
                <p className="text-gray-500 mt-4 text-sm italic">
                  First sold under the Connect Four trademark by Milton Bradley in February 1974.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-semibold mb-4 text-blue-600">Mathematical Solution</h3>
                <p className="text-gray-700 leading-relaxed">
                  Connect Four is a solved game. The first player can always win by playing the right moves. This was first published by James Dow Allen on October 1, 1988, and independently by Victor Allis on October 16, 1988. Allis also computed that the first player can force a win in at most 41 moves (with perfect play), by starting in the middle column.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-blue-600">Try it out!</h2>
            <SinglePlayerGameboard ref={new GameState()} />
          </div>

          <div className="flex flex-col gap-y-8 mb-12">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl p-5 mb-8 shadow-lg">
              <h2 className="text-3xl font-bold text-center">
                About The Team
              </h2>
            </div>
            <div className='flex flex-row flex-wrap gap-2 items-center w-full sm:w-5/6'>
              <Image src={abhinav.src} alt="Abhinav" className="rounded-full w-32 h-32 hover:drop-shadow-lg hover:scale-105 transition-all duration-200" width={128} height={128} />
              <div>
                <h3 className="text-xl font-medium">Abhinav <span className='text-gray-400 font-normal'>• Director • System Architect • Full Stack Developer</span></h3>
                <p>
                  My name is Abhinav and I have had a passion for game development for quite a while. I still remember launching my first 2D platformer with terrible graphics and physics in Year 10 of school and we had so much fun with it. I was inspired across the next few years by a friend who loved competitive games and we would spend hours trying to best each other at Connect Four but with no good online tool for improvement we were in a stalemate. Over the Summer after completing A levels I began working on this project using a Django backend which was a terrible idea for someone who had no experience in it, so invited another friend who is now my Co-Founder to help with the Typescript backend of the project.
                </p>
              </div>
            </div>

          <div className='flex flex-row flex-wrap gap-2 items-center'>
            <Image src={ivan.src} alt="Ivan" className="rounded-full w-32 h-32 hover:drop-shadow-lg hover:scale-105 transition-all duration-200" width={128} height={128} />
            <div>
              <h3 className="text-xl font-medium">Ivan <span className='text-gray-400 font-normal'>• Full Stack Developer • Cyber-security Consultant</span></h3>
              <p>
                Hi, I'm Ivan, a computer engineering student at Birmingham. I've been programming for nearly a decade, dabbling in everything from encrypted messaging to legal research, and I'm always working on one of my many projects! When I'm not coding, you can find me cycling, experimenting with recipes, or trying to photograph owls (with mixed success). I'm thrilled to bring this game to IC Hack and hope you'll enjoy playing and analysing matches as much as we enjoyed creating it.
              </p>
            </div>
          </div>

          <div className='flex flex-row flex-wrap gap-2 items-center'>
            <Image src={avery.src} alt="Avery" className="rounded-full w-32 h-32 hover:drop-shadow-lg hover:scale-105 transition-all duration-200" width={128} height={128} />
            <div>
              <h3 className="text-xl font-medium">Avery <span className='text-gray-400 font-normal'>• Frontend Developer</span></h3>
              <p>
                My name is Avery and I'm currently studying computing and IT at Open University. I was brought onto this project further into its life to help with the art and page design. I have been coding for a long time now and have gone through a fair few personal projects. Outside of coding, I quite like reading and gaming. I'm excited to be a part of this project and I hope you enjoy playing it as much as we enjoyed making it.
              </p>
            </div>
          </div>
        </div>
        <div className="text-center">
          <Link href="/" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
            Back to Home
          </Link>
        </div>
        <br /><br /><br />
      </div>
    </div>
  </div>
  );
}