'use client'

import React, { useRef, useState } from "react";
import Board, { BoardHandle } from "../Board";
import { StandardGame } from "@shared/utils/Games/game";

export default function SingleplayerBoardHandler() {
  const boardRef = useRef<BoardHandle>(null);
  const game = useRef(new StandardGame());
  const [gameOver, setGameOver] = useState(game.current.gameOver);
  console.log("REFRESH", game.current)

  const handleAttemptMove = (col: number) => {
    boardRef.current?.clearPremove();
    const colMax = game.current.getAvailableRow(col);
    if (colMax === -1) {
      console.warn("Column is full, cannot make move");
      return;
    }
    // 50% change to make a premove instead 
    const doPremove = Math.random() < 0.5;
    if (doPremove) {
      boardRef.current?.setPremoveCell(colMax, col, game.current.currentPlayer);
    } else {

      const result = game.current.makeMove(col);
      if (result.success) {
        const player = game.current.currentPlayer === 0 ? 1 : 0
        boardRef.current?.triggerMoveAnimation(result.row, col, player);
        console.log(result.row, col, player)
        setGameOver(game.current.gameOver); // <-- This triggers a re-render!
      }
    }
  };

  return (
    <Board
      ref={boardRef}
      interactive={true}
      boardState={game.current.getBoard()}
      gameOver={gameOver}
      animate_init={false}
      onColumnAttempt={handleAttemptMove}
      // ...other props...
    />
  );
} 