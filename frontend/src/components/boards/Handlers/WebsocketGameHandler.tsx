'use client'

import React, { useRef, useState, useEffect } from "react";
import { Board, BoardHandle } from "../Board";
import { StandardGame } from "@shared/utils/game";
import { useWebSocketContext } from "../../websocketProvider";

export default function SingleplayerBoardHandler() {
  const boardRef = useRef<BoardHandle>(null);
  const game = useRef(new StandardGame());
  const [gameOver, setGameOver] = useState(game.current.gameOver);
  
  // Use the WebSocket context
  const { sendJson, readyState, close, getLastJson } = useWebSocketContext();
  const [lastMessage, setLastMessage] = useState<any | null>(null);

  // Handle incoming WebSocket messages using the polling pattern
  useEffect(() => {
    const interval = setInterval(() => {
      const latest = getLastJson();
      if (latest !== lastMessage) {
        setLastMessage(latest);
        
        // Handle different message types
        if (latest) {
          try {
            switch (latest.type) {
              case 'game_move':
                // Handle opponent's move
                const result = game.current.makeMove(latest.column);
                if (result.success) {
                  boardRef.current?.triggerMoveAnimation(result.row, latest.column, game.current.currentPlayer);
                  setGameOver(game.current.gameOver);
                }
                break;
              case 'game_start':
                // Handle game start
                break;
              case 'game_over':
                // Handle game over
                setGameOver(true);
                break;
              default:
                console.log('Unknown message type:', latest.type);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [getLastJson, lastMessage]);

  const handleAttemptMove = (col: number) => {
    const result = game.current.makeMove(col);
    if (result.success) {
      // Send move to server via WebSocket
      sendJson({
        type: 'game_move',
        column: col,
        row: result.row,
        player: game.current.currentPlayer
      });
      
      // Update local board
      boardRef.current?.triggerMoveAnimation(result.row, col, game.current.currentPlayer);
      setGameOver(game.current.gameOver);
    }
  };

  return (
    <div>
      {/* Show connection status */}
      <div className="mb-4 text-sm">
        Status: {readyState === 1 ? 'Connected' : 'Disconnected'}
      </div>
      
      <Board
        ref={boardRef}
        interactive={readyState === 1} // Only allow moves when connected
        boardState={game.current.getBoard()}
        gameOver={gameOver}
        animate_init={false}
        onColumnAttempt={handleAttemptMove}
      />
    </div>
  );
}
