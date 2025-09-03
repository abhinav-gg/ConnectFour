"use client"
// delay the piece appearing in place until after the animation
// on the first column, it doesnt fall to the right place
import type React from "react"
import { useImperativeHandle, forwardRef, useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import useSound from "@/utils/useSound"

// Color mapping for additional player tokens beyond red (0) and yellow (1)
const PLAYER_COLORS = {
  10: { bg: "bg-black", hex: "#000000" },
  11: { bg: "bg-white", hex: "#ffffff" },
  12: { bg: "bg-blue-500", hex: "#3b82f6" },
  13: { bg: "bg-green-500", hex: "#22c55e" },
  14: { bg: "bg-purple-500", hex: "#a855f7" },
  15: { bg: "bg-pink-500", hex: "#ec4899" },
  16: { bg: "bg-orange-500", hex: "#f97316" },
  17: { bg: "bg-cyan-500", hex: "#06b6d4" },
}

interface Connect4BoardProps {
  interactive?: boolean
  onColumnAttempt?: (col: number) => void
  boardState?: (number | null)[][]
  gameOver?: boolean
  animate_init: boolean
  showLastMoveHighlight?: boolean

  ariaLabel?: string
  className?: string
}

type HighlightState = "none" | "red" | "yellow"

interface Arrow {
  id: string
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

const getColorName = (tok: number | null): string => {
  if (tok === null) return "empty"
  // Keep existing behavior for 0 (red) and 1 (yellow)
  switch (tok) {
    case 0:
      return "red"
    case 1:
      return "yellow"
    default:
      return String(tok) // Return the number as a string for custom colors
  }
}

const getHexCode = (tok: number | null): string => {
  if (tok === null) return ""
  // Keep existing behavior for 0 (red) and 1 (yellow)
  switch (tok) {
    case 0:
      return "#e3342f"
    case 1:
      return "#fbbf24"
    default:
      // Return custom color hex code or fallback to a default
      return PLAYER_COLORS[tok as keyof typeof PLAYER_COLORS]?.hex || "#808080"
  }
}

export interface BoardHandle {
  triggerMoveAnimation: (row: number, col: number, player: number) => void
  setPremoveCell: (row: number, col: number, player: number) => void
  clearPremove: () => void
  // New: undo animation
  undoMoveAnimation: (row: number, col: number, player: number, lastMoveHighlight?: {row: number, col: number} | null) => void
  // New: directly set board state for animations
  setBoard: (newBoard: (number | null)[][]) => void
  // New: create arrows for analysis
  makeArrow: (startRow: number, startCol: number, endRow: number, endCol: number, id?: string) => string
}

const Board = forwardRef<BoardHandle, Connect4BoardProps>(
  (
    {
      interactive = false,
      onColumnAttempt,
      boardState,
      gameOver = false,
      animate_init = false,
      showLastMoveHighlight = true,

      ariaLabel = "Connect 4 game board",
      className = "",
    },
    ref,
  ) => {
    // Default empty board state
    const defaultBoard: (number | null)[][] = Array(6)
      .fill(null)
      .map(() => Array(7).fill(null))

    const [internalBoard, setInternalBoard] = useState(defaultBoard)
    const [currentPlayer, setCurrentPlayer] = useState<number>(0)
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
    const [highlightedCells, setHighlightedCells] = useState<Map<string, HighlightState>>(new Map())
    const [fallingPieces, setFallingPieces] = useState<
      {
        col: number
        targetRow: number
        player: number
        duration: number
        id: string
        targetTop: number
        targetLeft: number
      }[]
    >([])
    // New: rising pieces for undo animation
    const [risingPieces, setRisingPieces] = useState<
      {
        col: number
        targetRow: number
        player: number
        duration: number
        id: string
      }[]
    >([])
    const [moveBufferActive, setMoveBufferActive] = useState(false)
    const [mouseHeld, setMouseHeld] = useState(false)
    const [heldColumn, setHeldColumn] = useState<number | null>(null)
    const [isInteractive, setInteractive] = useState(interactive)

    // Arrow-related state
    const [arrows, setArrows] = useState<Arrow[]>([])
    const [isDrawingArrow, setIsDrawingArrow] = useState(false)
    const [arrowStartCell, setArrowStartCell] = useState<{ row: number; col: number } | null>(null)
    const [rightMouseDown, setRightMouseDown] = useState(false)

    // New state for last move highlight and premove
    const [lastMoveHighlight, setLastMoveHighlightState] = useState<{ row: number; col: number } | null>(null)
    const [premoveColumn, setPremoveColumn] = useState<number | null>(null)

    // Timeout tracking to prevent conflicts during rapid navigation
    const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const moveBufferTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup function for ALL timeouts and animations (aggressive)
    const clearAllTimeouts = () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
        moveTimeoutRef.current = null
      }
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
        undoTimeoutRef.current = null
      }
      if (lastMoveTimeoutRef.current) {
        clearTimeout(lastMoveTimeoutRef.current)
        lastMoveTimeoutRef.current = null
      }
      if (moveBufferTimeoutRef.current) {
        clearTimeout(moveBufferTimeoutRef.current)
        moveBufferTimeoutRef.current = null
      }
    }

    // Clear only backward animations and timeouts
    const clearBackwardAnimations = () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
        undoTimeoutRef.current = null
      }
      if (lastMoveTimeoutRef.current) {
        clearTimeout(lastMoveTimeoutRef.current)
        lastMoveTimeoutRef.current = null
      }
      setRisingPieces([])
    }

    // Sound effect for piece drop
    const DropSound = useSound("/sounds/counter-fall-long.mp3")

    // Utility to detect if device is mobile
    // MOBILE CALCULATION - Enhanced detection for touch devices
    const isMobile = typeof window !== "undefined" && (
      window.matchMedia("(max-width: 567px)").matches || 
      ('ontouchstart' in window && window.matchMedia("(max-width: 1024px)").matches)
    )
    
    // Animation ID counter to ensure unique keys
    const animationIdRef = useRef(0)
    const getNextAnimationId = () => ++animationIdRef.current
    
    const getFallId = (row: number, col: number, player: number) => `fall-${row}-${col}-${player}-${getNextAnimationId()}`
    // New: unique id generator for rising pieces
    const getRiseId = (row: number, col: number, player: number) => `rise-${row}-${col}-${player}-${getNextAnimationId()}`

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

    // Arrow validation helper functions
    const isValidArrowTarget = (startRow: number, startCol: number, endRow: number, endCol: number): boolean => {
      const rowDiff = endRow - startRow
      const colDiff = endCol - startCol

      // Check if it's a straight line (horizontal, vertical, or diagonal)
      const isHorizontal = rowDiff === 0 && colDiff !== 0
      const isVertical = colDiff === 0 && rowDiff !== 0
      const isDiagonal = Math.abs(rowDiff) === Math.abs(colDiff) && rowDiff !== 0 && colDiff !== 0

      if (!isHorizontal && !isVertical && !isDiagonal) {
        return false
      }

      // Check if distance is 4 or more cells
      const distance = Math.max(Math.abs(rowDiff), Math.abs(colDiff))
      return distance >= 3
    }

    const clearArrowsAndHighlights = () => {
      setArrows([])
      setHighlightedCells(new Map())
    }

    //
    useEffect(() => {
      setInteractive(interactive)
    }, [interactive])

    // Animate initial board state if animate_init is true
    useEffect(() => {
      console.log("Animating initial board state:", animate_init, "with boardState:", boardState)
      if (!boardState) return

      if (!animate_init) return setInternalBoard(boardState)

      // If animate_init is true, animate the initial board state
      // Reset internal board to empty

      setInternalBoard(defaultBoard)

      setInteractive(false)
      // Flatten the board into a list of {row, col, player} for non-null cells
      const cells: { row: number; col: number; player: number }[] = []
      boardState.forEach((rowArr, row) => {
        rowArr.forEach((val, col) => {
          if (val !== null) {
            cells.push({ row, col, player: val })
          }
        })
      })

      if (cells.length === 0) {
        setInteractive(true) // No pieces to animate, set interactive immediately
        return
      }
      // Sort cells for bottom-left to top-right animation
      cells.sort((a, b) => {
        if (a.row !== b.row) return b.row - a.row // bottom to top
        return a.col - b.col // left to right
      })

      let cancelled = false

      async function animateCells() {
        for (let i = 0; i < cells.length; i++) {
          if (cancelled) return
          const { row, col, player } = cells[i]
          const fallId = getFallId(row, col, player)
          // Find the lowest empty row in this column in the current internalBoard
          setFallingPieces((prev) => [
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
          ])
          setTimeout(
            () => {
              setFallingPieces((prev) => prev.filter((p) => p.id !== fallId))
              setInternalBoard((prevBoard) => {
                const newBoard = prevBoard.map((boardRow, rowIndex) =>
                  boardRow.map((cell, colIndex) => {
                    if (rowIndex === row && colIndex === col) {
                      return player
                    }
                    return cell
                  }),
                )
                return newBoard
              })
              // Set last move highlight after the piece has landed (only if showLastMoveHighlight is true)
              if (showLastMoveHighlight) {
                setLastMoveHighlightState({ row, col })
              }
              // check if this is the last falling piece, if so setInteractive(true);
              if (i === cells.length - 1) {
                setInteractive(interactive)
              }
            },
            0.15 * (row + 1) * 1000,
          )

          // Wait a bit before next piece
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 120))
        }
      }
      animateCells()
      return () => {
        cancelled = true
      }
    }, [animate_init, showLastMoveHighlight])

    // Cleanup effect to clear all timeouts on unmount
    useEffect(() => {
      return () => {
        clearAllTimeouts()
      }
    }, [])

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

    // Calculate row and column from mouse position
    const getCellFromMousePosition = (
      e: React.MouseEvent,
      boardElement: HTMLElement,
    ): { row: number; col: number } | null => {
      const rect = boardElement.getBoundingClientRect()
      const padding = rect.width * 0.02 // 2% padding
      const boardWidth = rect.width - padding * 2
      const boardHeight = rect.height - padding * 2
      const relativeX = e.clientX - rect.left - padding
      const relativeY = e.clientY - rect.top - padding

      if (relativeX < 0 || relativeX > boardWidth || relativeY < 0 || relativeY > boardHeight) return null

      // Calculate column
      const columnWidth = boardWidth / 7
      const gapWidth = columnWidth * 0.15
      const effectiveColumnWidth = columnWidth - gapWidth

      let col = -1
      let currentX = 0
      for (let c = 0; c < 7; c++) {
        const colStart = currentX
        const colEnd = currentX + effectiveColumnWidth

        if (relativeX >= colStart && relativeX <= colEnd) {
          col = c
          break
        }

        currentX += columnWidth
      }

      if (col === -1) return null

      // Calculate row
      const rowHeight = boardHeight / 6
      const row = Math.floor(relativeY / rowHeight)

      if (row < 0 || row >= 6) return null

      return { row, col }
    }

    useImperativeHandle(ref, () => ({
      triggerMoveAnimation(row, col, player) {
        if (row === -1) return // Column is full

        // Animation duration proportional to distance fallen
        const baseDuration = 0.15 // seconds per row
        const duration = baseDuration * (row + 1)
        console.log("ACTUALLY PLAYING ANIMATIONS")
        // Play drop sound when a piece falls (not during animate_init)
        DropSound.play()

        // Get the target cell's position
        const cell = cellRefs.current[row][col]
        const boardRect = boardContainerRef.current?.getBoundingClientRect()
        let targetTop = 0
        let targetLeft = 0
        if (cell && boardRect) {
          const cellRect = cell.getBoundingClientRect()
          targetTop = cellRect.top - boardRect.top
          targetLeft = cellRect.left - boardRect.left
        }
        setFallingPieces((prev) => [
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

        // Clear only backward animations and timeouts
        clearBackwardAnimations()

        // Update the board immediately
        // Delay updating the internal board by the duration of the falling animation
        moveTimeoutRef.current = setTimeout(() => {
          setInternalBoard((prevBoard) => {
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
          // Set last move highlight after the piece has landed (only if showLastMoveHighlight is true)
          if (showLastMoveHighlight) {
            setLastMoveHighlightState({ row, col })
          }
          moveTimeoutRef.current = null
        }, duration * 1000)
        setCurrentPlayer(player === 0 ? 1 : 0)
      },

      setPremoveCell(row, col, player) {
        // Set premove for the column
        setPremoveColumn(col)
      },

      clearPremove() {
        setPremoveColumn(null)
      },

      // New: reverse/lift animation for undo
      undoMoveAnimation(row, col, player, lastMoveHighlight = null) {
        console.log(`🎮 BOARD: undoMoveAnimation called - AGGRESSIVE clearing`)
        
        // AGGRESSIVE: Clear ALL timeouts and animations
        clearAllTimeouts()
        setFallingPieces([])
        setRisingPieces([])
        
        // Basic bounds validation
        if (row < 0 || row > 5 || col < 0 || col > 6) {
          console.warn(`🎮 BOARD: Invalid bounds for undo animation: row=${row}, col=${col}`)
          return
        }
        
        // Use interim method: check if there's a piece in the current internal board at this position
        const currentPiece = internalBoard[row][col]
        console.log(`🎮 BOARD: Current piece at (${row}, ${col}):`, currentPiece)
        
        if (currentPiece === null) {
          console.warn(`🎮 BOARD: No piece found at (${row}, ${col}) for undo animation`)
          return
        }
        
        console.log(`🎮 BOARD: Starting undo animation at (${row}, ${col}) for player ${player}`)

        // Compute duration to mirror drop timing
        const baseDuration = 0.15
        const duration = baseDuration * (row + 1)
        const riseId = getRiseId(row, col, player)

        // Immediately clear the static piece so only the animation is visible
        setInternalBoard((prev) =>
          prev.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? null : c))),
        )

        // Set the last move highlight if provided, otherwise clear it
        setLastMoveHighlightState(lastMoveHighlight)

        // Start the rising animation
        setRisingPieces((prev) => [
          ...prev,
          {
            col,
            targetRow: row,
            player,
            duration,
            id: riseId,
          },
        ])

        console.log(`🎮 BOARD: Rising piece animation started with id=${riseId}, duration=${duration}`)

        // Clear any existing undo timeout before setting a new one
        if (undoTimeoutRef.current) {
          clearTimeout(undoTimeoutRef.current)
        }
        
        // After animation completes, set current player back to the undone player
        undoTimeoutRef.current = setTimeout(() => {
          setCurrentPlayer(player)
          console.log(`🎮 BOARD: Undo animation completed, current player set to ${player}`)
          undoTimeoutRef.current = null
        }, duration * 1000)
      },

      // New: directly set the board state for animations without affecting game logic
      setBoard(newBoard: (number | null)[][]) {
        console.log(`🎮 BOARD: setBoard called - AGGRESSIVE clearing`)
        
        // AGGRESSIVE: Clear ALL timeouts and animations
        clearAllTimeouts()
        setFallingPieces([])
        setRisingPieces([])
        
        // Set the new board state
        setInternalBoard(newBoard)
        setLastMoveHighlightState(null)
        
        console.log(`🎮 BOARD: Board state updated aggressively`)
      },

      // New: create an arrow for analysis/hints
      makeArrow(startRow: number, startCol: number, endRow: number, endCol: number, id: string = `arrow-${Date.now()}`) {
        const newArrow = {
          id,
          startRow,
          startCol,
          endRow,
          endCol,
        }
        setArrows(prev => [...prev, newArrow])
        return id
      },
    }))

    const handleColumnClick = (col: number) => {
      if (!isInteractive || col === -1 || moveBufferActive) return

      setMoveBufferActive(true)
      
      // Clear existing timeout and set new one
      if (moveBufferTimeoutRef.current) {
        clearTimeout(moveBufferTimeoutRef.current)
      }
      moveBufferTimeoutRef.current = setTimeout(() => {
        setMoveBufferActive(false)
        moveBufferTimeoutRef.current = null
      }, 50)

      if (onColumnAttempt) onColumnAttempt(col)
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
        const isFallingPieceInColumn = fallingPieces.some((piece) => piece.col === col)
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

      // Reset arrow drawing state if right mouse button is not held
      // Arrows will persist until explicitly cleared by right-click on board or failed drag
      if (!rightMouseDown) {
        setIsDrawingArrow(false)
        setArrowStartCell(null)
      }
    }

    const handleBoardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isInteractive) return

      if (e.button === 2) {
        // Right mouse button
        e.preventDefault() // Prevent default context menu on board background
        const boardElement = e.currentTarget
        const cell = getCellFromMousePosition(e, boardElement)

        if (cell) {
          setRightMouseDown(true)
          setIsDrawingArrow(true)
          setArrowStartCell(cell)
        }
        return
      }

      if (e.button === 0) {
        // Left mouse button
        const boardElement = e.currentTarget
        const col = getColumnFromMousePosition(e, boardElement)
        if (col >= 0) {
          setMouseHeld(true)
          setHeldColumn(col)
        }
      }
    }

    const handleBoardMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isInteractive) return

      if (e.button === 2) {
        // Right mouse button
        e.preventDefault() // Prevent context menu on board background
        const boardElement = e.currentTarget
        const endCell = getCellFromMousePosition(e, boardElement)

        // If we were drawing an arrow AND a valid arrow target was found, add the arrow
        if (
          isDrawingArrow &&
          arrowStartCell &&
          endCell &&
          isValidArrowTarget(arrowStartCell.row, arrowStartCell.col, endCell.row, endCell.col)
        ) {
          const newArrow: Arrow = {
            id: `arrow-${Date.now()}-${Math.random()}`,
            startRow: arrowStartCell.row,
            startCol: arrowStartCell.col,
            endRow: endCell.row,
            endCol: endCell.col,
          }
          setArrows((prev) => [...prev, newArrow])
        } else if (
          arrowStartCell &&
          endCell &&
          endCell.row === arrowStartCell.row &&
          endCell.col === arrowStartCell.col
        ) {
          // This was a single right-click on a cell (start and end are the same cell)
          // Toggle highlight for this cell
          const cellKey = getCellKey(endCell.row, endCell.col)
          const currentHighlight = highlightedCells.get(cellKey) || "none"
          const newHighlightedCells = new Map(highlightedCells)

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
        } else {
          // If right-click was released on a different cell, or not on a cell,
          // and no valid arrow was drawn, clear highlights and arrows.
          clearArrowsAndHighlights()
        }

        // Always reset right-click related states
        setRightMouseDown(false)
        setIsDrawingArrow(false)
        setArrowStartCell(null)
        return
      }

      if (e.button === 0) {
        // Left mouse button
        const boardElement = e.currentTarget
        const col = getColumnFromMousePosition(e, boardElement)
        if (mouseHeld && heldColumn !== null && heldColumn !== -1 && col === heldColumn) {
          handleColumnClick(col)
        }
        setMouseHeld(false)
        setHeldColumn(null)
      }
    }

    const handleBoardRightClick = (e: React.MouseEvent) => {
      e.preventDefault()
      // Clear all highlights and arrows when right-clicking outside slots
      if (highlightedCells.size > 0 || arrows.length > 0) {
        clearArrowsAndHighlights()
      }
    }

    // Touch event handlers for mobile - eliminates 300ms delay
    const handleBoardTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isInteractive || !isMobile) return
      e.preventDefault() // Prevent scroll and other touch gestures
      
      const touch = e.touches[0]
      const boardElement = e.currentTarget
      const col = getColumnFromTouchPosition(touch, boardElement)
      
      if (col >= 0 && col < 7) {
        setHeldColumn(col)
        setMouseHeld(true)
      }
    }

    const handleBoardTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isInteractive || !isMobile) return
      e.preventDefault()
      
      const boardElement = e.currentTarget
      const touch = e.changedTouches[0]
      const col = getColumnFromTouchPosition(touch, boardElement)
      
      // Only trigger click if touch ended in the same column it started
      if (mouseHeld && heldColumn !== null && heldColumn !== -1 && col === heldColumn) {
        handleColumnClick(col)
      }
      
      setMouseHeld(false)
      setHeldColumn(null)
    }

    const handleBoardTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isInteractive || !isMobile) return
      e.preventDefault() // Prevent scrolling while dragging on board
      
      // Update held column if touch moves to different column
      const touch = e.touches[0]
      const boardElement = e.currentTarget
      const col = getColumnFromTouchPosition(touch, boardElement)
      
      if (mouseHeld && col !== heldColumn) {
        // Touch moved to different column, cancel the click
        setHeldColumn(-1)
      }
    }

    // Helper function to get column from touch position
    const getColumnFromTouchPosition = (touch: React.Touch, boardElement: HTMLDivElement) => {
      const rect = boardElement.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const colWidth = rect.width / 7
      const col = Math.floor(x / colWidth)
      return col >= 0 && col < 7 ? col : -1
    }

    const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault() // Prevent context menu
      e.stopPropagation() // Stop event from bubbling
      // The actual highlighting logic is now handled in handleBoardMouseUp
      // This function only prevents the browser's context menu and event bubbling.
    }

    const handleCellLeftClick = (e: React.MouseEvent, row: number, col: number) => {
      e.stopPropagation() // Stop event from bubbling
      if (e.button !== 0) return // Only allow left click
      if (!interactive || fallingPieces.length > 0) return

      const cellKey = getCellKey(row, col)
      const newHighlightedCells = new Map(highlightedCells)

      // Remove highlight if cell is highlighted
      if (newHighlightedCells.has(cellKey)) {
        newHighlightedCells.delete(cellKey)
        setHighlightedCells(newHighlightedCells)
        return // Don't proceed with column click
      }

      // If not highlighted, proceed with normal column click
      handleColumnClick(col)
    }

    // Touch handlers for cells - faster mobile response
    const handleCellTouchEnd = (e: React.TouchEvent, row: number, col: number) => {
      if (!isMobile) return // Only use touch handlers on mobile
      e.preventDefault()
      e.stopPropagation()
      
      if (!interactive || fallingPieces.length > 0) return

      const cellKey = getCellKey(row, col)
      const newHighlightedCells = new Map(highlightedCells)

      // Remove highlight if cell is highlighted
      if (newHighlightedCells.has(cellKey)) {
        newHighlightedCells.delete(cellKey)
        setHighlightedCells(newHighlightedCells)
        return // Don't proceed with column click
      }

      // If not highlighted, proceed with normal column click
      handleColumnClick(col)
    }

    const getCellColor = (cellValue: string, isGhost = false) => {
      // Handle standard red and yellow colors as before
      switch (cellValue) {
        case "red":
          return isGhost ? "bg-brand-accent-red opacity-50" : "bg-brand-accent-red"
        case "yellow":
          return isGhost ? "bg-brand-accent-yellow opacity-50" : "bg-brand-accent-yellow"
        case "empty":
          return "bg-brand-accent-blue-dark opacity-60"
        default:
          // For custom player numbers, use the color mapping
          const playerNum = parseInt(cellValue, 10)
          if (!isNaN(playerNum) && PLAYER_COLORS[playerNum as keyof typeof PLAYER_COLORS]) {
            const bgClass = PLAYER_COLORS[playerNum as keyof typeof PLAYER_COLORS].bg
            return isGhost ? `${bgClass} opacity-50` : bgClass
          }
          // Fallback color for unrecognized values
          return isGhost ? "bg-gray-500 opacity-50" : "bg-gray-500"
      }
    }

    const getHighlightStyle = (highlightState: HighlightState, isLastMove = false) => {
      const ringWidth = isMobile ? "ring-4" : "ring-8"

      if (isLastMove) {
        return `${ringWidth} ring-green-500 ring-opacity-90 shadow-md`
      }

      switch (highlightState) {
        case "red":
          return `${ringWidth} ring-brand-accent-red ring-opacity-90 shadow-md`
        case "yellow":
          return `${ringWidth} ring-brand-accent-yellow ring-opacity-90 shadow-md`
        case "none":
          return ""
      }
    }

    const getCellAriaLabel = (row: number, col: number, cellValue: string) => {
      const position = `Row ${row + 1}, Column ${col + 1}`
      const state = cellValue === "empty" ? "Empty" : `${cellValue} piece`
      const highlightState = highlightedCells.get(getCellKey(row, col))
      const highlighted = highlightState ? `, highlighted ${highlightState}` : ""
      const isLastMove =
        showLastMoveHighlight && lastMoveHighlight && lastMoveHighlight.row === row && lastMoveHighlight.col === col
      const lastMoveText = isLastMove ? ", last move" : ""
      return `${position}, ${state}${highlighted}${lastMoveText}`
    }

    // Check if this cell should show a ghost token
    const shouldShowGhost = (row: number, col: number) => {
      if (!interactive || hoveredColumn !== col) return false
      const dropRow = getDropRow(col)
      return dropRow === row && internalBoard[row][col] === null
    }

    // Check if this cell should show a premove chevron
    const shouldShowPremoveChevron = (row: number, col: number) => {
      if (premoveColumn === null || premoveColumn !== col) return false
      return internalBoard[row][col] === null
    }

    // Check if this cell is the last move
    const isLastMoveCell = (row: number, col: number) => {
      return (
        showLastMoveHighlight && lastMoveHighlight && lastMoveHighlight.row === row && lastMoveHighlight.col === col
      )
    }

    // Get highlight state for a cell - updated to handle numeric states
    const getCellHighlightState = (row: number, col: number): HighlightState => {
      return highlightedCells.get(getCellKey(row, col)) || "none"
    }

    // Arrow rendering component
    const renderArrow = (arrow: Arrow) => {
      const startCell = cellRefs.current[arrow.startRow][arrow.startCol]
      const endCell = cellRefs.current[arrow.endRow][arrow.endCol]

      if (!startCell || !endCell || !boardContainerRef.current) return null

      const boardRect = boardContainerRef.current.getBoundingClientRect()
      const startRect = startCell.getBoundingClientRect()
      const endRect = endCell.getBoundingClientRect()

      const startX = startRect.left - boardRect.left + startRect.width / 2
      const startY = startRect.top - boardRect.top + startRect.height / 2
      const endX = endRect.left - boardRect.left + endRect.width / 2
      const endY = endRect.top - boardRect.top + endRect.height / 2

      const angle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI
      const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)

      // Calculate arrow thickness based on piece radius
      const pieceDiameter = startRect.width * 0.85
      const pieceRadius = pieceDiameter / 2
      const arrowThickness = pieceRadius / 3 // 1/3 the radius

      const arrowheadSize = arrowThickness * 2 // Arrowhead size proportional to thickness

      return (
        <div
          key={arrow.id}
          className="absolute pointer-events-none"
          style={{
            left: startX,
            top: startY - arrowThickness / 2, // Adjust top to center the arrow line
            width: length,
            height: arrowThickness,
            backgroundColor: "rgba(255, 140, 0, 0.6)", // Orange with 60% opacity
            transformOrigin: "0 50%",
            transform: `rotate(${angle}deg)`,
            zIndex: 30,
          }}
        >
          {/* Arrowhead */}
          <div
            className="absolute"
            style={{
              right: -arrowheadSize, // Position arrowhead at the end
              top: "50%", // Center vertically
              transform: "translateY(-50%)", // Adjust for vertical centering
              width: 0,
              height: 0,
              borderLeft: `${arrowheadSize}px solid rgba(255, 140, 0, 0.6)`, // Orange
              borderTop: `${arrowheadSize / 2}px solid transparent`,
              borderBottom: `${arrowheadSize / 2}px solid transparent`,
            }}
          />
        </div>
      )
    }

    // Refs for each cell
    const cellRefs = useRef<Array<Array<HTMLDivElement | null>>>(
      Array(6)
        .fill(null)
        .map(() => Array(7).fill(null)),
    )
    const boardContainerRef = useRef<HTMLDivElement>(null)

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
        onTouchStart={handleBoardTouchStart}
        onTouchEnd={handleBoardTouchEnd}
        onTouchMove={handleBoardTouchMove}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Falling Piece Animation - DOM-based Positioning */}
        <AnimatePresence>
          {fallingPieces.map((piece) => {
            const maskId = `falling-piece-mask-${piece.id}`
            // Get all cell centers in the column
            const holes = []
            for (let r = 0; r <= piece.targetRow; r++) {
              const cell = cellRefs.current[r][piece.col]
              if (cell && boardContainerRef.current) {
                const boardRect = boardContainerRef.current.getBoundingClientRect()
                const cellRect = cell.getBoundingClientRect()
                const cx = cellRect.left - boardRect.left + cellRect.width / 2
                const cy = cellRect.top - boardRect.top + cellRect.height / 2
                const radius = cellRect.width * 0.425
                holes.push({ cx, cy, radius })
              }
            }
            // Animate cy from top to target cell center
            const startCy = holes.length > 0 ? holes[0].cy : 0
            const endCy = holes.length > 0 ? holes[holes.length - 1].cy : 0
            const cx = holes.length > 0 ? holes[0].cx : 0
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
                      <circle key={idx} cx={hole.cx} cy={hole.cy} r={hole.radius} fill="white" />
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
                  style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
                  transition={{
                    type: "tween",
                    duration: piece.duration,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  onAnimationComplete={() => setFallingPieces((prev) => prev.filter((p) => p.id !== piece.id))}
                />
              </motion.svg>
            )
          })}
        </AnimatePresence>

        {/* New: Rising Piece Animation (Undo) - Reverse of falling */}
        <AnimatePresence>
          {risingPieces.map((piece) => {
            const maskId = `rising-piece-mask-${piece.id}`
            const holes: { cx: number; cy: number; radius: number }[] = []
            for (let r = 0; r <= piece.targetRow; r++) {
              const cell = cellRefs.current[r][piece.col]
              if (cell && boardContainerRef.current) {
                const boardRect = boardContainerRef.current.getBoundingClientRect()
                const cellRect = cell.getBoundingClientRect()
                const cx = cellRect.left - boardRect.left + cellRect.width / 2
                const cy = cellRect.top - boardRect.top + cellRect.height / 2
                const radius = cellRect.width * 0.425
                holes.push({ cx, cy, radius })
              }
            }
            const startCy = holes.length > 0 ? holes[holes.length - 1].cy : 0 // start at target cell
            const endCy = (holes.length > 0 ? holes[0].cy : 0) - (holes[0].radius * 2)
            const cx = holes.length > 0 ? holes[0].cx : 0

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
                      <circle key={idx} cx={hole.cx} cy={hole.cy} r={hole.radius} fill="white" />
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
                  style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
                  transition={{
                    type: "tween",
                    duration: piece.duration,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  onAnimationComplete={() => setRisingPieces((prev) => prev.filter((p) => p.id !== piece.id))}
                />
              </motion.svg>
            )
          })}
        </AnimatePresence>

        {/* Arrows */}
        {arrows.map((arrow) => renderArrow(arrow))}

        {/* Game board grid - 6 rows x 7 columns */}
        <div className="w-full h-full flex flex-col justify-between relative z-20">
          {internalBoard.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-between items-center no-drag"
              role="row"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            >
              {row.map((cell, colIndex) => {
                const isGhost = shouldShowGhost(rowIndex, colIndex)
                const showPremoveChevron = shouldShowPremoveChevron(rowIndex, colIndex)
                const isLastMove = isLastMoveCell(rowIndex, colIndex)
                const highlightState = getCellHighlightState(rowIndex, colIndex)
                const displayValue = isGhost ? currentPlayer : cell

                return (
                  <div
                    key={colIndex}
                    ref={(el) => {
                      cellRefs.current[rowIndex][colIndex] = el
                    }}
                    className="flex-shrink-0 flex items-center justify-center no-drag relative"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
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
                      ${getHighlightStyle(highlightState, isLastMove ?? false)}
                      cursor-pointer relative z-30
                      no-drag
                    `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      role="gridcell"
                      aria-label={getCellAriaLabel(rowIndex, colIndex, getColorName(cell))}
                      onClick={(e) => handleCellLeftClick(e, rowIndex, colIndex)}
                      onTouchEnd={(e) => handleCellTouchEnd(e, rowIndex, colIndex)}
                      onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
                      onDragStart={(e) => e.preventDefault()}
                      draggable={false}
                    />

                    {/* Animated premove chevron indicator */}
                    {showPremoveChevron && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                        <motion.div
                          animate={{
                            y: [-2, 2, -2], // Bob up and down by 4px total
                          }}
                          transition={{
                            duration: 1.5, // Slower, more gentle animation
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        >
                          <ChevronDown className="w-6 h-6 text-green-500 opacity-50" strokeWidth={3} />
                        </motion.div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  },
)

Board.displayName = 'Board';
export default Board
