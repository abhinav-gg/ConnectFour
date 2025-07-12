'use client'

import React, { useRef, useState } from "react";
import { Board, BoardHandle } from "./Board";
import { StandardGame } from "@shared/utils/game";

export default function SingleplayerBoardHandler() {
  const boardRef = useRef<BoardHandle>(null);
  const game = useRef(new StandardGame());
  const [gameOver, setGameOver] = useState(game.current.gameOver);

  const handleAttemptMove = (col: number) => {
    const result = game.current.makeMove(col);
    if (result.success) {
      boardRef.current?.triggerMoveAnimation(result.row, col, game.current.currentPlayer);
      setGameOver(game.current.gameOver); // <-- This triggers a re-render!
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