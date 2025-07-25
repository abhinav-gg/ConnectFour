"use client"
// delay the piece appearing in place until after the animation
// on the first column, it doesnt fall to the right place
import React, { useImperativeHandle, forwardRef, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"

interface Connect4BoardProps {
  interactive?: boolean
  onColumnAttempt?: (col: number) => void
  boardState?: (number | null)[][]
  gameOver?: boolean
  animate_init: boolean

  ariaLabel?: string
  className?: string
}

type HighlightState = "none" | "red" | "yellow"

const getColorName = (tok: number | null): string => {
  switch (tok) {
    case 0:
      return "red";
    case 1:
      return "yellow";
    default:
      return "empty";
  }
};

const getHexCode = (tok: number | null): string => {
  switch (tok) {
    case 0:
      return "#e3342f";
    case 1:
      return "#fbbf24";
    default:
      return "";
  }
};


export interface BoardHandle {
  triggerMoveAnimation: (row: number, col: number, player: number) => void;
  setPremoveCell: (row: number, col: number, plauer: number) => void;
}

const Board = forwardRef<BoardHandle, Connect4BoardProps>(
  ({
    interactive = false,
    onColumnAttempt,
    boardState,
    gameOver = false,
    animate_init = false,

    ariaLabel = "Connect 4 game board",
    className = "",
  }, ref) => {

    
  // Default empty board state
  const defaultBoard: (number | null)[][] = Array(6)
    .fill(null)
    .map(() => Array(7).fill(null))

  const [internalBoard, setInternalBoard] = useState(defaultBoard)
  const [currentPlayer, setCurrentPlayer] = useState<number>(0)
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [highlightedCells, setHighlightedCells] = useState<Map<string, HighlightState>>(new Map())
  const [fallingPieces, setFallingPieces] = useState<{
    col: number
    targetRow: number
    player: number
    duration: number
    id: string
    targetTop: number
    targetLeft: number
  }[]>([])
  const [moveBufferActive, setMoveBufferActive] = useState(false)
  const [mouseHeld, setMouseHeld] = useState(false)
  const [heldColumn, setHeldColumn] = useState<number | null>(null)
  const [isInteractive, setInteractive] = useState(interactive)
  
  // Utility to detect if device is mobile
  // MOBILE CALCULATION
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 567px)').matches;
  const getFallId = (row: number, col: number, player: number) => `${row}-${col}-${player}`

  // Create a unique key for each cell position
  const getCellKey = (row: number, col: number) => `${row}-${col}`

  // Find the lowest empty row in a column for ghost token placement
  const getDropRow = (col: number) => {
    for (let r = 5; r >= 0; r--) {
      if (internalBoard[r][col] === null) {
        return r
      }
    }
    return -1 // Column is full
  }

  // 
  useEffect(() => {
    setInteractive(interactive);
  }, [interactive]);

  // Animate initial board state if animate_init is true
  useEffect(() => {
    if (!boardState) return;
    
    if (!animate_init) return setInternalBoard(boardState);

    setInteractive(false);
    // Flatten the board into a list of {row, col, player} for non-null cells
    const cells: { row: number; col: number; player: number }[] = [];
    boardState.forEach((rowArr, row) => {
      rowArr.forEach((val, col) => {
        if (val !== null) {
          cells.push({ row, col, player: val });
        }
      });
    });
    // Sort cells for bottom-left to top-right animation
    cells.sort((a, b) => {
      if (a.row !== b.row) return b.row - a.row; // bottom to top
      return a.col - b.col; // left to right
    });

    let cancelled = false;

    async function animateCells() {
      for (let i = 0; i < cells.length; i++) {
        if (cancelled) return;
        const { row, col, player } = cells[i];
        const fallId = getFallId(row, col, player)
        // Find the lowest empty row in this column in the current internalBoard
        setFallingPieces(prev => [
          ...prev,
          {
            col,
            targetRow: row,
            player: player,
            duration: 0.15 * (row + 1),
            id: fallId,
            targetTop: 0, // Placeholder, will be set in useImperativeHandle
            targetLeft: 0, // Placeholder, will be set in useImperativeHandle
          },
        ]);
        setTimeout(() => {
          setFallingPieces(prev => prev.filter(p => p.id !== fallId));
          setInternalBoard(prevBoard => {
            const newBoard = prevBoard.map((boardRow, rowIndex) =>
              boardRow.map((cell, colIndex) => {
                if (rowIndex === row && colIndex === col) {
                  return player;
                }
                return cell;
              })
            );
            return newBoard;
          });
          // check if this is the last falling piece, if so setInteractive(true);
          if (i === cells.length - 1) {
            setInteractive(interactive);
          }
        }, 0.15 * (row + 1) * 1000);

        // Wait a bit before next piece
        // eslint-disable-next-line no-await-in-loop
        await new Promise(res => setTimeout(res, 120));
      }
    }
    animateCells();
    return () => {
      cancelled = true;
    };
    
  }, [animate_init]);

  // Calculate column from mouse position
  const getColumnFromMousePosition = (e: React.MouseEvent, boardElement: HTMLElement) => {
    const rect = boardElement.getBoundingClientRect()
    const padding = rect.width * 0.02 // 2% padding
    const boardWidth = rect.width - padding * 2
    const relativeX = e.clientX - rect.left - padding

    if (relativeX < 0 || relativeX > boardWidth) return -1

    // Calculate column considering gaps
    const columnWidth = boardWidth / 7
    const gapWidth = columnWidth * 0.15 // 1.5% gap as fraction of column width
    const effectiveColumnWidth = columnWidth - gapWidth

    let currentX = 0
    for (let col = 0; col < 7; col++) {
      const colStart = currentX
      const colEnd = currentX + effectiveColumnWidth

      if (relativeX >= colStart && relativeX <= colEnd) {
        return col
      }

      currentX += columnWidth
    }

    return -1
  }

  useImperativeHandle(ref, () => ({
    triggerMoveAnimation(row, col, player) {
      
      if (row === -1) return; // Column is full

      // Animation duration proportional to distance fallen
      const baseDuration = 0.15 // seconds per row
      const duration = baseDuration * (row + 1)

      // Get the target cell's position
      const cell = cellRefs.current[row][col];
      const boardRect = boardContainerRef.current?.getBoundingClientRect();
      let targetTop = 0;
      let targetLeft = 0;
      if (cell && boardRect) {
        const cellRect = cell.getBoundingClientRect();
        targetTop = cellRect.top - boardRect.top;
        targetLeft = cellRect.left - boardRect.left;
      }
      setFallingPieces(prev => [
        ...prev,
        {
          col,
          targetRow: row,
          player: player,
          duration: 0.15 * (row + 1),
          id: getFallId(row, col, player),
          targetTop,
          targetLeft,
        },
      ])
      setHoveredColumn(null)

      // Update the board immediately
      // Delay updating the internal board by the duration of the falling animation
      setTimeout(() => {
        setInternalBoard(prevBoard => {
          const newBoard = prevBoard.map((boardRow, rowIndex) =>
            boardRow.map((cell, colIndex) => {
              if (rowIndex === row && colIndex === col) {
                return player
              }
              return cell
            }),
          )
          // console.log("BOARD UPDATE", row, col, player)
          return newBoard
        })
      }, duration * 1000)
      setCurrentPlayer(player === 0 ? 1 : 0)

    },

    setPremoveCell(row, col, player) {

    }
  }));

  const handleColumnClick = (col: number) => {
    if (!isInteractive || col === -1 || moveBufferActive) return

    setMoveBufferActive(true)
    setTimeout(() => setMoveBufferActive(false), 50)

    if (onColumnAttempt) onColumnAttempt(col);
  }

  const handleBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || gameOver || isMobile) {
      setHoveredColumn(null) // Hide hovered column if not interactive or game over
      return
    }

    const boardElement = e.currentTarget
    const col = getColumnFromMousePosition(e, boardElement)

    if (fallingPieces.length > 0) {
      // first check if the current column is one with an animation
      const isFallingPieceInColumn = fallingPieces.some(piece => piece.col === col)
      if (isFallingPieceInColumn) {
        // If a piece is already falling in this column, don't update hoveredColumn
        setHoveredColumn(null)
        return
      }  
    }

    setHoveredColumn(col >= 0 ? col : null)

    // If mouse is held and we leave the board (col === -1), set heldColumn to -1
    if (mouseHeld && col === -1) {
      setHeldColumn(-1)
    }
  }

  const handleBoardMouseLeave = () => {
    setHoveredColumn(null)
    // If mouse leaves the board while held, set heldColumn to -1
    if (mouseHeld) setHeldColumn(-1)
  }

  // Remove handleBoardClick logic, replaced by mouse up logic
  const handleBoardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive) return
    const boardElement = e.currentTarget
    const col = getColumnFromMousePosition(e, boardElement)
    if (col >= 0) {
      setMouseHeld(true)
      setHeldColumn(col)
    }
  }

  const handleBoardMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    if (e.button !== 0) return; // Only allow left click
    const boardElement = e.currentTarget;
    const col = getColumnFromMousePosition(e, boardElement);
    if (mouseHeld && heldColumn !== null && heldColumn !== -1 && col === heldColumn) {
      handleColumnClick(col);
    }
    setMouseHeld(false);
    setHeldColumn(null);
  }

  const handleBoardRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Clear all highlights when right-clicking outside slots
    if (highlightedCells.size > 0) {
      setHighlightedCells(new Map())
    }
  }

  const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault() // Prevent context menu
    e.stopPropagation() // Stop event from bubbling

    if (!interactive) return

    const cellKey = getCellKey(row, col)
    const currentHighlight = highlightedCells.get(cellKey) || "none"
    const newHighlightedCells = new Map(highlightedCells)

    // Cycle through: none → red → yellow → none
    switch (currentHighlight) {
      case "none":
        newHighlightedCells.set(cellKey, "red")
        break
      case "red":
        newHighlightedCells.set(cellKey, "yellow")
        break
      case "yellow":
        newHighlightedCells.delete(cellKey) // Back to none
        break
    }

    setHighlightedCells(newHighlightedCells)
  }

  const handleCellLeftClick = (e: React.MouseEvent, row: number, col: number) => {
    e.stopPropagation(); // Stop event from bubbling
    if (e.button !== 0) return; // Only allow left click
    if (!interactive || fallingPieces.length > 0) return;

    const cellKey = getCellKey(row, col);
    const newHighlightedCells = new Map(highlightedCells);

    // Remove highlight if cell is highlighted
    if (newHighlightedCells.has(cellKey)) {
      newHighlightedCells.delete(cellKey);
      setHighlightedCells(newHighlightedCells);
      return; // Don't proceed with column click
    }

    // If not highlighted, proceed with normal column click
    handleColumnClick(col);
  }

  const getCellColor = (cellValue: string, isGhost = false) => {
    switch (cellValue) {
      case "red":
        return isGhost ? "bg-brand-accent-red opacity-50" : "bg-brand-accent-red"
      case "yellow":
        return isGhost ? "bg-brand-accent-yellow opacity-50" : "bg-brand-accent-yellow"
      default:
        return "bg-brand-accent-blue-dark opacity-60"
    }
  }

  const getHighlightStyle = (highlightState: HighlightState) => {
    const ringWidth = isMobile ? 'ring-4' : 'ring-8';
    switch (highlightState) {
      case "red":
        return `${ringWidth} ring-brand-accent-red ring-opacity-90 shadow-md`;
      case "yellow":
        return `${ringWidth} ring-brand-accent-yellow ring-opacity-90 shadow-md`;
      case "none":
      default:
        return "";
    }
  }

  const getCellAriaLabel = (row: number, col: number, cellValue: string) => {
    const position = `Row ${row + 1}, Column ${col + 1}`
    const state = cellValue === "empty" ? "Empty" : `${cellValue} piece`
    const highlightState = highlightedCells.get(getCellKey(row, col))
    const highlighted = highlightState ? `, highlighted ${highlightState}` : ""
    return `${position}, ${state}${highlighted}`
  }

  // Check if this cell should show a ghost token
  const shouldShowGhost = (row: number, col: number) => {
    if (!interactive || hoveredColumn !== col) return false
    const dropRow = getDropRow(col)
    return dropRow === row && internalBoard[row][col] === null
  }

  // Get highlight state for a cell
  const getCellHighlightState = (row: number, col: number): HighlightState => {
    return highlightedCells.get(getCellKey(row, col)) || "none"
  }

  // Refs for each cell
  const cellRefs = useRef<Array<Array<HTMLDivElement | null>>>(
    Array(6).fill(null).map(() => Array(7).fill(null))
  );
  const boardContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boardContainerRef}
      className={`no-drag w-full aspect-square max-w-2xl max-h-[90vh] bg-brand-accent-blue rounded-2xl p-[2%] flex flex-col justify-center relative overflow-hidden cursor-pointer ${className}`}
      role={interactive ? "grid" : "img"}
      aria-label={ariaLabel}
      tabIndex={interactive ? 0 : undefined}
      onMouseMove={handleBoardMouseMove}
      onMouseLeave={handleBoardMouseLeave}
      onMouseDown={handleBoardMouseDown}
      onMouseUp={handleBoardMouseUp}
      onContextMenu={handleBoardRightClick}
      draggable={false}
      onDragStart={e => e.preventDefault()}
    >
      {/* Falling Piece Animation - DOM-based Positioning */}
      <AnimatePresence>
        {fallingPieces.map(piece => {
          const maskId = `falling-piece-mask-${piece.id}`;
          // Get all cell centers in the column
          const holes = [];
          for (let r = 0; r <= piece.targetRow; r++) {
            const cell = cellRefs.current[r][piece.col];
            if (cell && boardContainerRef.current) {
              const boardRect = boardContainerRef.current.getBoundingClientRect();
              const cellRect = cell.getBoundingClientRect();
              const cx = cellRect.left - boardRect.left + cellRect.width / 2;
              const cy = cellRect.top - boardRect.top + cellRect.height / 2;
              const radius = cellRect.width * 0.425;
              holes.push({ cx, cy, radius });
            }
          }
          // Animate cy from top to target cell center
          const startCy = holes.length > 0 ? holes[0].cy : 0;
          const endCy = holes.length > 0 ? holes[holes.length - 1].cy : 0;
          const cx = holes.length > 0 ? holes[0].cx : 0;
          return (
            <motion.svg
              key={piece.id}
              className="absolute z-50 pointer-events-none"
              style={{
                left: 0,
                top: 0,
                width: boardContainerRef.current?.offsetWidth,
                height: boardContainerRef.current?.offsetHeight,
              }}
              width={boardContainerRef.current?.offsetWidth}
              height={boardContainerRef.current?.offsetHeight}
            >
              <defs>
                <mask id={maskId}>
                  <rect x="0" y="0" width="100%" height="100%" fill="black" />
                  {holes.map((hole, idx) => (
                    <circle
                      key={idx}
                      cx={hole.cx}
                      cy={hole.cy}
                      r={hole.radius}
                      fill="white"
                    />
                  ))}
                </mask>
              </defs>
              <motion.circle
                cx={cx}
                initial={{ cy: startCy }}
                animate={{ cy: endCy }}
                r={holes.length > 0 ? holes[0].radius : 0}
                fill={getHexCode(piece.player)}
                mask={`url(#${maskId})`}
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
                transition={{
                  type: 'tween',
                  duration: piece.duration,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                onAnimationComplete={() => setFallingPieces(prev => prev.filter(p => p.id !== piece.id))}
              />
            </motion.svg>
          );
        })}
      </AnimatePresence>

      {/* Game board grid - 6 rows x 7 columns */}
      <div className="w-full h-full flex flex-col justify-between relative z-20">
        {internalBoard.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-between items-center no-drag"
            role="row"
            draggable={false}
            onDragStart={e => e.preventDefault()}
          >
            {row.map((cell, colIndex) => {
              const isGhost = shouldShowGhost(rowIndex, colIndex)
              const highlightState = getCellHighlightState(rowIndex, colIndex)
              const displayValue = isGhost ? currentPlayer : cell

              return (
                <div
                  key={colIndex}
                  ref={el => { cellRefs.current[rowIndex][colIndex] = el; }}
                  className="flex-shrink-0 flex items-center justify-center no-drag"
                  draggable={false}
                  onDragStart={e => e.preventDefault()}
                  style={{
                    width: `calc((100% - 6 * 1.5%) / 7)`, // 7 columns with 1.5% gaps
                    aspectRatio: "1",
                  }}
                >
                  <motion.div
                    className={`
                      w-[85%] h-[85%]
                      ${getCellColor(getColorName(displayValue), isGhost)} 
                      rounded-full 
                      transition-all duration-200
                      ${isGhost ? "animate-pulse" : ""}
                      ${getHighlightStyle(highlightState)}
                      cursor-pointer relative z-30
                      no-drag
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    role="gridcell"
                    aria-label={getCellAriaLabel(rowIndex, colIndex, getColorName(cell))}
                    onClick={(e) => handleCellLeftClick(e, rowIndex, colIndex)}
                    onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
                    onDragStart={e => e.preventDefault()}
                    draggable={false}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
})

export default Board