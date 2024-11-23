import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import GameBoard from './game-board'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <StrictMode>
    <GameBoard />
  </StrictMode>
)
