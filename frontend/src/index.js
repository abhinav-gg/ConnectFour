import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import GameBoard from './game-board';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GameBoard />
  </React.StrictMode>
);

reportWebVitals();
