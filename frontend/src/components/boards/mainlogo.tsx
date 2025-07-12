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

function LogoTemplate({
  rows = 6,
  cols = 7,
  initialColor = 'empty',
  onUpdate,
  isStatic = false,
  colorList
}: LogoTemplateProps) {
  const [grid, setGrid] = useState<CellColor[][]>(() => {
    if (colorList) {
      const newGrid: CellColor[][] = []
      let colorIndex = 0
      for (let i = 0; i < rows; i++) {
        const row: CellColor[] = []
        for (let j = 0; j < cols; j++) {
          row.push(colorList[colorIndex] || initialColor)
          colorIndex++
        }
        newGrid.push(row)
      }
      return newGrid
    }
    return Array(rows).fill(null).map(() => Array(cols).fill(initialColor))
  })
  const [currentColor, setCurrentColor] = useState<CellColor>('red')
  const [exportedColors, setExportedColors] = useState<string>('')

  useEffect(() => {
    if (colorList) {
      const newGrid: CellColor[][] = []
      let colorIndex = 0
      for (let i = 0; i < rows; i++) {
        const row: CellColor[] = []
        for (let j = 0; j < cols; j++) {
          row.push(colorList[colorIndex] || initialColor)
          colorIndex++
        }
        newGrid.push(row)
      }
      setGrid(newGrid)
    }
  }, [colorList, rows, cols, initialColor])

  useEffect(() => {
    const flatColors = grid.flat()
    setExportedColors(flatColors.join(', '))
    onUpdate?.(grid)
  }, [grid, onUpdate])


  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-7 gap-[1px] bg-blue-700 p-[2px] rounded-lg">
        {grid.map((row, i) => (
          row.map((cell, j) => (
            <button
              key={`${i}-${j}`}
              className={`w-2 h-2 rounded-full ${colorClasses[cell]} ${isStatic ? '' : 'cursor-pointer'}`}
              disabled={isStatic}
              aria-label={`Cell ${i+1}-${j+1}, Color: ${cell}`}
            />
          ))
        ))}
      </div>
      {!isStatic && (
        <>
          <div className="flex space-x-2 mb-4">
            {Object.entries(colorClasses).map(([color, className]) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full ${className} ${color === currentColor ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                aria-label={`Select ${color} color`}
              />
            ))}
          </div>
          <div className="w-full mt-4">
            <h3 className="text-lg font-semibold mb-2">Exported Colors:</h3>
            <p className="break-words bg-gray-100 p-2 rounded">{exportedColors}</p>
          </div>
        </>
      )}
    </div>
  )
}

export default function ichacklogo() {
  return (
    <div className="inline-block">
      <LogoTemplate
        isStatic={true}
        rows={6}
        cols={7}
        colorList={gameboardColors}
      />
    </div>
  )
}