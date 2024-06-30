"use client";

import { CellState, Game, type GameState } from "@lib/connect4";
import { useEffect, useState } from 'react';

function Home() {
  console.log("Home");
  const sidebarItems = ["Play", "Puzzles", "Learn"];

  const players = [
    {
      name: "Example Player",
      rating: 1600,
      color: "yellow-300",
    },
    {
      name: "You",
      rating: 1600,
      color: "emerald-300",
    },
  ];

  const [game] = useState(new Game());
  const [gameState, setGameState] = useState(game.gameState);

  useEffect(() => {
    const subscriber = (state: GameState) => setGameState({ ...state });
    game.subscribe(subscriber);
    return () => {
      // Clean up subscription on unmount
      game.unsubscribe(subscriber);
    };
  }, [game]);

  const renderGrid = (i: number, j: number) => {
    if (gameState.grid[i][j] === CellState.Player1) {
      return <td className="w-1/7 h-1/6 bg-emerald-300"></td>;
    } else if (gameState.grid[i][j] === CellState.Player2) {
      return <td className="w-1/7 h-1/6 bg-yellow-300"></td>;
    } else {
      return <td className="w-1/7 h-1/6 bg-transparent"></td>;
    }
  };

  const renderGridOverlay = (i: number, j: number) => {
    if (j === gameState.lowestCellIndices[i] && gameState.grid[i][j] === CellState.Empty) {
      if (gameState.currentPlayer === 0) {
        return (
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-300 w-5 aspect-square rounded-full"></span>
        );
      } else {
        return (
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group-hover:bg-yellow-300 w-5 aspect-square rounded-full"></span>
        );
      }
    } else if (gameState.lastMove[0] === i && gameState.lastMove[1] === j) {
      return (
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-transparent ring-4 sm:ring-8 ring-white rounded-full aspect-square circ-width"></span>
      );
    }
  };

  return (
    <main className="w-full h-screen flex flex-row bg-[#302E2B]">
      <div className="h-full bg-neutral-800 hidden md:flex flex-col">
        <h1 className="flex items-center justify-center w-full text-xl text-white font-bold py-3 px-6">
          Connect 4
        </h1>
        {sidebarItems.map((item, key) => (
          <a
            className="flex items-center w-full text-lg text-white font-semibold py-2 pl-6"
            href={`/${item.toLowerCase()}`} key={key}
          >
            {item}
          </a>
        ))}
      </div>
      <div className="bg-[#302E2B] flex md:p-4 items-center justify-center h-screen">
        <div className="flex flex-col w-full justify-start gap-y-3 max-h-screen">
          <div className="flex flex-row gap-2 items-center">
            <span className="bg-yellow-300 w-10 aspect-square rounded-sm"></span>
            <span className="font-medium text-white">Example Player <span className="font-light text-stone-400">(1600)</span></span>
          </div>
          <div className="flex items-center justify-center md:rounded-md flex-grow overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full flex flex-row z-10 board-padding">
              {Array.from({ length: 7 }).map((_, i) => (
                <table className="w-full h-full border-spacing-0 border-none group" cellSpacing="0" cellPadding="0" key={i}>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <tr className="w-full h-1/6" key={j}>
                        {renderGrid(i, j)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>

            <img src="/grid.svg" className="object-contain max-h-full z-10" alt="Connect Four grid" />

            <div className="absolute top-0 left-0 w-full h-full p-[1.5060241%] flex flex-row z-20">
              {Array.from({ length: 7 }).map((_, i) => (
                <table className="w-full h-full border-spacing-0 border-none group" cellSpacing="0" cellPadding="0" key={i}>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <tr className="w-full h-1/6" key={j}>
                        <td className="w-1/7 h-1/6 group-hover:bg-black/20 cursor-pointer relative" onClick={() => { game.captureCell(i); }}>
                          {renderGridOverlay(i, j)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <span className="bg-emerald-300 w-10 aspect-square rounded-sm"></span>
            <span className="font-medium text-white">You <span className="font-light text-stone-400">(1600)</span></span>
          </div>
        </div>
      </div>
      <div className="h-full hidden md:flex p-4 bg-[#302E2B]">
        <div className="rounded-lg bg-neutral-900 flex flex-col p-4 mr-auto">
          <span className="text-white font-bold text-4xl">Play vs...</span>
          <div className="flex items-center justify-center w-full mt-6 flex-col gap-2">
            <span className="w-24 aspect-square rounded-md bg-yellow-300"></span>
            <span className="text-white text-lg font-bold">Example Player <span className="font-light text-stone-400">(1600)</span></span>
          </div>
        </div>
      </div>

      <style>{`
        .circ-width {
          width: calc((72 / 92) * 98%);
        }

        .board-padding {
          padding: calc(10 / 664 * 100%);
        }
      `}</style>
    </main>
  );
}

export default Home;
