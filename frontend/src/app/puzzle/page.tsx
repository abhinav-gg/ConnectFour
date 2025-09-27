"use client"

import { useRef, useState } from "react"
import { Puzzle } from "@shared/utils/puzzles"
import { BoardHandle } from "@/components/game/Board"
import { UnifiedGameLayout } from "@/components/layouts/game-layout"
import { PuzzleUI } from "@/components/puzzles/puzzle-ui"
import { PuzzleProgress } from "@/components/puzzles/puzzle-progress"

// Example fixed puzzle string
const puzzle = new Puzzle("45342133|4243543")

export default function PuzzlePage() {
  const [puzzleFinished, setPuzzleFinished] = useState(false);
  const [puzzleResults, setPuzzleResults] = useState<Array<"success" | "failure">>([]);
  const [showScoreChange, setShowScoreChange] = useState<{change: number, type: "positive" | "negative"} | null>(null);
  const [currentScore, setCurrentScore] = useState(1082);
  const unifiedLayoutRef = useRef<BoardHandle>(null);
  const initialBoardRef = useRef(puzzle.getBoard().map(row => [...row]));

  const handleColumnAttempt = (col: number) => {
    try {
      const result = puzzle.attemptMove(col);
      if (!result.succ) {
        setPuzzleResults(prev => [...prev, "failure"]);
        setPuzzleFinished(true);
        setShowScoreChange({ change: -25, type: "negative" });
        // Update the score after a brief delay to allow the score change to be shown first
        setTimeout(() => {
          setCurrentScore(prev => prev - 25);
        }, 300);
        setTimeout(() => {
          setShowScoreChange(null);
          console.log("loading next puzzle");
        }, 2000);
        return;
      } else {
        // Animate the board for the correct move
        console.log(result.row1!, result.col1!, puzzle.getMyCol)
        unifiedLayoutRef.current?.triggerMoveAnimation(result.row1!, result.col1!, puzzle.getMyCol);
        if (typeof result.col2 !== "undefined" && result.col2 !== null) {
          const opponent = puzzle.getMyCol === 0 ? 1 : 0;
          setTimeout(() => unifiedLayoutRef.current?.triggerMoveAnimation(result.row2!, result.col2!, opponent), 150 * (result.row1!));
        } else {
          setTimeout(() => {
            setPuzzleResults(prev => [...prev, "success"]);
            setPuzzleFinished(true);
            setShowScoreChange({ change: 50, type: "positive" });
            // Update the score after a brief delay to allow the score change to be shown first
            setTimeout(() => {
              setCurrentScore(prev => prev + 50);
            }, 300);
            setTimeout(() => {
              setShowScoreChange(null);
              console.log("loading next puzzle");
            }, 2000);
          }, 150 * (result.row1! + 1)); // 150ms per row
        }
      }
    } catch (err) {
      setPuzzleResults(prev => [...prev, "failure"]);
      setPuzzleFinished(true);
      setShowScoreChange({ change: -25, type: "negative" });
      // Update the score after a brief delay to allow the score change to be shown first
      setTimeout(() => {
        setCurrentScore(prev => prev - 25);
      }, 300);
      setTimeout(() => {
        setShowScoreChange(null);
        console.log("loading next puzzle");
      }, 2000);
    }
  };

  // Only allow voting after puzzle is finished
  const handleVote = (vote: "up" | "down") => {
    if (!puzzleFinished) return;
    // setPuzzleResults(prev => [...prev, vote === "up" ? "success" : "failure"]);
  };

  // Show red score change if solution is pressed
  const handleSolution = () => {
    setPuzzleResults(prev => [...prev, "failure"]);
    setPuzzleFinished(true);
    setShowScoreChange({ change: -25, type: "negative" });
    // Update the score after a brief delay to allow the score change to be shown first
    setTimeout(() => {
      setCurrentScore(prev => prev - 25);
    }, 300);
    setTimeout(() => {
      setShowScoreChange(null);
      console.log("loading next puzzle");
    }, 2000);
  };

  // Optionally, you can define these handlers for score, hint, etc.
  const handleScoreChange = (change: number, type: "positive" | "negative") => {
    if (showScoreChange) return; // override with our own
    console.log(`Score changed: ${type === "positive" ? "+" : ""}${change}`)
  }
  const handleHint = () => {
    console.log("Hint requested")
  }

  return (
    <UnifiedGameLayout
      ref={unifiedLayoutRef}
      layout={{
        showScoreBar: false,
        showTimers: false,
        showPlayerInfo: false,
        contentRatio: "50%"
      }}
      board={{
        interactive: !puzzleFinished,
        boardState: initialBoardRef.current,
        gameOver: puzzleFinished,
        animate_init: false,
        onColumnAttempt: handleColumnAttempt,
      }}
    >
      <div className="space-y-4">
        <PuzzleProgress puzzleResults={puzzleResults} />
        <PuzzleUI
          score={currentScore}
          playedTimes={247}
          onScoreChange={handleScoreChange}
          onVote={handleVote}
          onHint={handleHint}
          onSolution={handleSolution}
          currentPlayer={puzzle.getMyCol === 0 ? "red" : "yellow"}
          showVoting={puzzleFinished}
          scoreChange={showScoreChange}
        />
      </div>
    </UnifiedGameLayout>
  )
}
