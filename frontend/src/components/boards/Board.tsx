"use client"
// delay the piece appearing in place until after the animation
// on the first column, it doesnt fall to the right place
import React, { useImperativeHandle, forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"

interface Connect4BoardProps {
  interactive?: boolean
  onColumnAttempt?: (col: number) => void
  boardState?: (0 | 1 | null)[][]
  gameOver?: boolean
  animate_init: boolean

  ariaLabel?: string
  className?: string
}

type HighlightState = "none" | "red" | "yellow"

const convert = (tok: (0 | 1 | null)): "red" | "yellow" | "empty" => {
  if (tok === 0) return "red"
  if (tok === 1) return "yellow"
  return "empty"
}

export interface BoardHandle {
  triggerMoveAnimation: (row: number, col: number, player: 0 | 1) => void;
}

export const Board = forwardRef<BoardHandle, Connect4BoardProps>(
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
  const defaultBoard: (0 | 1 | null)[][] = Array(6)
    .fill(null)
    .map(() => Array(7).fill(null))

  const [internalBoard, setInternalBoard] = useState(boardState || defaultBoard)
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0)
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [highlightedCells, setHighlightedCells] = useState<Map<string, HighlightState>>(new Map())
  const [fallingPieces, setFallingPieces] = useState<{
    col: number
    targetRow: number
    player: "red" | "yellow"
    duration: number
    id: number
  }[]>([])
  const [fallingId, setFallingId] = useState(0)
  const [moveBufferActive, setMoveBufferActive] = useState(false)
  const [mouseHeld, setMouseHeld] = useState(false)
  const [heldColumn, setHeldColumn] = useState<number | null>(null)
  
  // Utility to detect if device is mobile
  // MOBILE CALCULATION
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 567px)').matches;


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

  // Debug: Log boardState every 3 seconds (React-safe)
  useEffect(() => {
    const interval = setInterval(() => {
      // console.log(internalBoard);
    }, 3000);
    return () => clearInterval(interval);
  }, [boardState]);

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
      // Animate the piece falling, update board state, etc.

      setMoveBufferActive(true)
      setTimeout(() => setMoveBufferActive(false), 50)
      // Use the current board state to find the target row for the animation
      
      if (row === -1) return; // Column is full

      // Animation duration proportional to distance fallen
      const baseDuration = 0.15 // seconds per row
      const duration = baseDuration * (row + 1)

      // Add a new falling piece animation
      setFallingPieces(prev => [
        ...prev,
        {
          col,
          targetRow: row,
          player: currentPlayer === 0 ? "red" : "yellow",
          duration,
          id: fallingId,
        },
      ])
      setFallingId(id => id + 1)
      setHoveredColumn(null)

      // Update the board immediately
      // Delay updating the internal board by the duration of the falling animation
      setTimeout(() => {
        setInternalBoard(prevBoard => {
          const newBoard = prevBoard.map((boardRow, rowIndex) =>
            boardRow.map((cell, colIndex) => {
              if (rowIndex === row && colIndex === col) {
                return currentPlayer
              }
              return cell
            }),
          )
          return newBoard
        })
      }, duration * 1000)
      setCurrentPlayer(currentPlayer === 0 ? 1 : 0)
    }
  }));

  const handleColumnClick = (col: number) => {
    if (!interactive || col === -1 || moveBufferActive) return

    if (onColumnAttempt) onColumnAttempt(col);
  }

  const handleBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || gameOver || isMobile) {
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
    if (!interactive) return
    const boardElement = e.currentTarget
    const col = getColumnFromMousePosition(e, boardElement)
    if (col >= 0) {
      setMouseHeld(true)
      setHeldColumn(col)
    }
  }

  const handleBoardMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
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

  const getCellColor = (cellValue: "red" | "yellow" | "empty", isGhost = false) => {
    switch (cellValue) {
      case "red":
        return isGhost ? "bg-brand-accent-red opacity-50" : "bg-brand-accent-red"
      case "yellow":
        return isGhost ? "bg-brand-accent-yellow opacity-50" : "bg-brand-accent-yellow"
      case "empty":
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

  const getCellAriaLabel = (row: number, col: number, cellValue: "red" | "yellow" | "empty") => {
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

  return (
    <div
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
      {/* Falling Piece Animation - SVG Masked Column Approach */}
      <AnimatePresence>
        {interactive && fallingPieces.map(piece => (
          <div
            key={piece.id}
            className="absolute inset-[2%] pointer-events-none z-40 no-drag"
            draggable={false}
            onDragStart={e => e.preventDefault()}
          >
            {/* SVG mask for the falling piece column */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
              <defs>
                <mask id={`falling-piece-mask-${piece.id}`}> {/* Unique mask per piece */}
                  <rect x="0" y="0" width="100" height="100" fill="black" />
                  {Array.from({ length: piece.targetRow + 1 }).map((_, rowIdx) => {
                    const col = piece.col
                    const colWidth = 100 / 7
                    const rowHeight = 100 / 6
                    const cx = col * colWidth + colWidth / 2
                    const cy = rowIdx * rowHeight + rowHeight / 2
                    const r = colWidth * 0.4
                    return (
                      <circle
                        key={`mask-hole-${rowIdx}`}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="white"
                      />
                    )
                  })}
                </mask>
              </defs>
              <g mask={`url(#falling-piece-mask-${piece.id})`}>
                <motion.circle
                  initial={{ cy: -10 }}
                  animate={{ cy: (piece.targetRow + 0.5) * (100 / 6) }}
                  // exit={{ opacity: 0 }}
                  transition={{
                    type: 'tween',
                    duration: piece.duration,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  cx={(piece.col + 0.5) * (100 / 7)}
                  r={(100 / 7) * 0.4}
                  fill={piece.player === 'red' ? '#e3342f' : '#fbbf24'}
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
                  onAnimationComplete={() => setFallingPieces(prev => prev.filter(p => p.id !== piece.id))}
                />
              </g>
            </svg>
          </div>
        ))}
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
                      ${getCellColor(convert(displayValue), isGhost)} 
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
                    aria-label={getCellAriaLabel(rowIndex, colIndex, convert(cell))}
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
