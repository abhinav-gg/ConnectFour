'use client'

import React, { useRef, useState, useEffect } from "react";
import Board, { BoardHandle } from "../Board";
import { StandardGame } from "@shared/utils/game";
import { PUBLIC_BOTS } from "@shared/utils/botHandler";
import { Cell } from "@shared/types/game";
import { SelfAnalysis } from "@shared/utils/analysis";

export default function BotChallengeBoardHandler() {
  const boardRef = useRef<BoardHandle>(null);
  const game = useRef(new StandardGame());
  const [gameOver, setGameOver] = useState(game.current.gameOver);
  const [isBotTurn, setIsBotTurn] = useState(game.current.currentPlayer === 1);
  const bot = useRef<any | null>(null);
  const anal = useRef<SelfAnalysis | null>(null);

  const initialBoardRef = useRef<Cell[][]>(
    Array(6).fill(null).map(() => Array(7).fill(null))
  );

  useEffect(() => {
    // This runs only on client after hydration
    console.log("Loading the WASM");
    bot.current = new PUBLIC_BOTS.random(game.current);
    const loadBotAndAnalysis = async () => {
      anal.current = await SelfAnalysis.load(game.current);
    };
    loadBotAndAnalysis();
  }, []);

  const handleAttemptMove = async (col: number) => {
    // Human move
    if (game.current.currentPlayer !== 0 || game.current.gameOver) return;
    const result = game.current.makeMove(col);
    if (result.success) {
      const player = 0;
      boardRef.current?.triggerMoveAnimation(result.row, col, player);
      setGameOver(game.current.gameOver);
      setIsBotTurn(true);
      setTimeout(botMove, 600);
    }
    console.log(`M${anal.current?.finalEval()}`)
  };

  const botMove = async () => {

    if (game.current.currentPlayer !== 1 || game.current.gameOver) return;

    const move = await bot.current.chooseMove();
    
    const result = game.current.makeMove(move);
    if (result.success) {
      const player = 1;
      boardRef.current?.triggerMoveAnimation(result.row, move, player);
      setGameOver(game.current.gameOver);
      setIsBotTurn(false);
    }
    console.log(`M${anal.current?.finalEval()}`)

  };


  return (
    <Board
      ref={boardRef}
      interactive={!isBotTurn && !gameOver}
      boardState={initialBoardRef.current}
      gameOver={gameOver}
      animate_init={false}
      onColumnAttempt={handleAttemptMove}
    />
  );
} 