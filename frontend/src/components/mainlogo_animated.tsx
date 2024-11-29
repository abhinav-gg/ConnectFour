'use client'

import React, { useState, useEffect } from 'react'

interface LogoTemplateProps {
  rows?: number
  cols?: number
  initialColor?: CellColor
  onUpdate?: (grid: CellColor[][]) => void
  isStatic?: boolean
  colorList?: CellColor[]
}

const colorClasses: Record<CellColor, string> = {
  'red': 'bg-red-500',
  'yellow': 'bg-yellow-400',
  'turquoise': 'bg-teal-400',
  'black': 'bg-black',
  'empty': 'bg-transparent'
}

type CellColor = 'red' | 'yellow' | 'turquoise' | 'black' | 'empty'

const gameboardColors: CellColor[] = [
  'black', 'black', 'black', 'black', 'black', 'black', 'black',
  'red', 'red', 'red', 'yellow', 'black', 'black', 'black',
  'red', 'black', 'black', 'yellow', 'black', 'yellow', 'black',
  'red', 'black', 'black', 'yellow', 'yellow', 'yellow', 'yellow',
  'red', 'red', 'red', 'black', 'black', 'yellow', 'black',
  'black', 'black', 'black', 'black', 'black', 'black', 'black'
];

function LogoTemplate({ rows = 6, cols = 7, isStatic = true }: LogoTemplateProps) {
  const [grid, setGrid] = useState<CellColor[][]>(
    Array(rows).fill(null).map(() => Array(cols).fill('empty'))
  );
  const [currentPieces, setCurrentPieces] = useState<Array<{row: number, col: number, color: CellColor}>>([]);
  
  useEffect(() => {
    const pieces = [...gameboardColors]
      .reverse()
      .map((color, index) => ({
        color,
        finalRow: Math.floor((gameboardColors.length - 1 - index) / cols),
        col: (gameboardColors.length - 1 - index) % cols
      }));

    pieces.forEach((piece, index) => {
      setTimeout(() => {
        for (let currentRow = -1; currentRow <= piece.finalRow; currentRow++) {
          setTimeout(() => {
            setGrid(prev => {
              const newGrid = prev.map(row => [...row]);
              // Clear previous position
              if (currentRow > 0) {
                newGrid[currentRow - 1][piece.col] = 'empty';
              }
              // Set new position if within grid
              if (currentRow >= 0) {
                newGrid[currentRow][piece.col] = piece.color;
              }
              return newGrid;
            });
          }, currentRow * 100); // Slowed down fall speed (was 50)
        }
      }, index * 50); // 50ms between pieces
    });
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-7 gap-[1px] bg-blue-700 p-[2px] rounded-lg">
        {grid.map((row, i) => (
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="w-6 h-6 rounded-full overflow-hidden relative"
            >
              <div
                className={`w-full h-full rounded-full ${
                  cell !== 'empty' ? colorClasses[cell] : 'bg-white bg-opacity-20'
                }`}
              />
              {currentPieces.some(piece => piece.col === j) && (
                <div
                  className={`absolute w-full h-full rounded-full ${
                    colorClasses[currentPieces.filter(piece => piece.col === j)
                      .sort((a, b) => b.row - a.row)[0]?.color ?? 'empty']
                  } transition-transform duration-50`}
                  style={{
                    transform: `translateY(${100 * i}%)`,
                    opacity: 1
                  }}
                />
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  );
}

export default function MainLogoAnimated() {
  return (
    <div className="inline-block">
      <LogoTemplate isStatic={true} />
    </div>
  );
}