import React, { useRef, useState } from "react";
import Board, { BoardHandle } from "../Board";
import { Puzzle } from "@shared/utils/puzzles";
import { Cell } from "@shared/types/game";

interface PuzzleHandlerProps {
  puzzle: Puzzle;
}

const PuzzleHandler: React.FC<PuzzleHandlerProps> = ({ puzzle }) => {
  const [puzzleFinished, setPuzzleFinished] = useState(false);
  const boardRef = useRef<BoardHandle>(null);
  // Deep clone the initial board so it never changes
  const initialBoardRef = useRef<Cell[][]>(
    puzzle.getBoard().map(row => [...row])
  );

  const handleColumnAttempt = (col: number) => {
    try {
      const result = puzzle.attemptMove(col);
      if (!result.succ) {
        console.log("Wrong move");
        return;
      }
      else {
        boardRef.current?.triggerMoveAnimation(result.row1!, result.col1!, puzzle.getMyCol)
        if (typeof result.col2 !== "undefined" && result.col2 !== null) {
            const opponent = puzzle.getMyCol === 0 ? 1 : 0
            setTimeout(() => boardRef.current?.triggerMoveAnimation(result.row2!, result.col2!, opponent), 150 * (result.row1!));
        } else {
            setTimeout(() => setPuzzleFinished(true), 150 * (result.row1! + 1)); // 150ms per row
        }
      } 
      
    } catch (err) {
      console.log("Error:", err);
    }
  };

  return (
    <Board
      ref={boardRef}
      interactive={!puzzleFinished}
      boardState={initialBoardRef.current}
      gameOver={puzzleFinished}
      animate_init={false}
      onColumnAttempt={handleColumnAttempt}
    />
  );
};

export default PuzzleHandler;
