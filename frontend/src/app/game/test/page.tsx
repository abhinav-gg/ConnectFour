// "use client"

// import { useState, useEffect, useRef } from "react"
// import { GameBoardLayout } from "../../../components/layouts/game-board-layout"
// import { TestControls } from "./test-sidecomponent"
// import { GameEndModal, GameResult, GameEndReason } from "../../../components/game/game-end-popup"
// import { GameStartModal } from "../../../components/game/game-start-popup"
// import { useError } from "@/components/providers/errorProvider"

// export default function GameTestPage() {
//   const [player1Time, setPlayer1Time] = useState(90)
//   const [player2Time, setPlayer2Time] = useState(90)
//   const [scoreRatio, setScoreRatio] = useState(0.5) // 0.5 means equal
//   const [isGameRunning, setIsGameRunning] = useState(false)
  
//   // Game Start Popup State
//   const [showStartPopup, setShowStartPopup] = useState(false)
//   const [gameMode, setGameMode] = useState("casual")
//   const [timeControl, setTimeControl] = useState("blitz")
//   const [gameUrl, setGameUrl] = useState("https://con4.uk/game/live/AWLFIJ")
//   const [opponentName, setOpponentName] = useState("")
//   const [opponentRating, setOpponentRating] = useState(1500)
//   const [myName, setMyName] = useState("MYSELF")
//   const [myPfp, setMyPfp] = useState("/icons/user.svg")
  
//   // Reference to store timeouts so they can be cleared
//   const timeoutRef = useRef<{
//     matchFound?: NodeJS.Timeout;
//     gameStart?: NodeJS.Timeout;
//   }>({
//     matchFound: undefined,
//     gameStart: undefined,
//   });

//   // Game End Popup State
//   const [showEndPopup, setShowEndPopup] = useState(false)
//   const [gameResult, setGameResult] = useState<GameResult>("win")
//   const [gameReason, setGameReason] = useState<GameEndReason>("checkmate")
//   const [playerName, setPlayerName] = useState("Test Player")
//   const [playerRating, setPlayerRating] = useState(1515)
//   const [ratingChange, setRatingChange] = useState(15)
//   const [mistakes, setMistakes] = useState(1)
//   const [blunders, setBlunders] = useState(0)
//   const [greatMoves, setGreatMoves] = useState(3)
//   // import from error
//   const { showError } = useError()

//   const handlePauseGame = () => setIsGameRunning(false)
//   const handleResetGame = () => {
//     setPlayer1Time(90)
//     setPlayer2Time(90)
//     setScoreRatio(0.5)
//     setIsGameRunning(false)
//   }

//   // Start Popup Handlers with timeout management
//   const handleShowStartPopup = () => {
//     // Clear any existing timeouts first
//     if (timeoutRef.current.matchFound) clearTimeout(timeoutRef.current.matchFound);
//     if (timeoutRef.current.gameStart) clearTimeout(timeoutRef.current.gameStart);
    
//     // Reset state
//     setOpponentName("");
//     setOpponentRating(1500);
//     setShowStartPopup(true);
    
//     // Set up new timeouts
//     timeoutRef.current.matchFound = setTimeout(() => {
//       setOpponentName("Test Opponent");
//       setOpponentRating(1500);
//       console.log("Match found for opponent:", "Test Opponent", "with rating:", 1500);
      
//       // After showing match found for 10 seconds, auto start the game
//       timeoutRef.current.gameStart = setTimeout(() => {
//         setShowStartPopup(false);
//         setIsGameRunning(true);
//         console.log("Game started automatically after match found")
//       }, 10000);
//     }, 6000)
//   }
  
//   const handleCloseStartPopup = () => {
//     // Clear timeouts when popup is closed
//     if (timeoutRef.current.matchFound) clearTimeout(timeoutRef.current.matchFound);
//     if (timeoutRef.current.gameStart) clearTimeout(timeoutRef.current.gameStart);
    
//     setShowStartPopup(false)
//     setOpponentName("") // Reset opponent data when closing
//   }
  
//   // Clean up timeouts when component unmounts
//   useEffect(() => {
//     showError("This is a test error message", "error");
//     return () => {
//       if (timeoutRef.current.matchFound) clearTimeout(timeoutRef.current.matchFound);
//       if (timeoutRef.current.gameStart) clearTimeout(timeoutRef.current.gameStart);
//     };
//   }, []);

//   // End Popup Handlers
//   const handleShowEndPopup = () => setShowEndPopup(true)
//   const handleCloseEndPopup = () => setShowEndPopup(false)
//   const handleReviewGame = () => console.log("Review game clicked")
//   const handleNewGame = () => console.log("New game clicked")
//   const handleRematch = () => console.log("Rematch clicked")

//   return (
//     <>
//       <GameBoardLayout
//         player1Name="Test Player 1"
//         player2Name="Test Player 2"
//         player1Time={player1Time * 1000}
//         player2Time={player2Time * 1000}
//         scoreRatio={scoreRatio}
//         isGameRunning={isGameRunning}
//         onPauseGame={handlePauseGame}
//         onResetGame={handleResetGame}
//         boardProps={{
//           interactive: true, // Make board interactive for testing
//           animate_init: false,
//           ariaLabel: "Connect 4 test board",
//         }}
//         displayScoreBar={true} // Always display score bar in test mode
//       >
//         <TestControls
//           player1Time={player1Time}
//           player2Time={player2Time}
//           scoreRatio={scoreRatio}
//           isGameRunning={isGameRunning}
//           onPlayer1TimeChange={setPlayer1Time}
//           onPlayer2TimeChange={setPlayer2Time}
//           onScoreRatioChange={setScoreRatio}
//           onPauseGame={handlePauseGame}
//           onResetGame={handleResetGame}
//           // Game End Popup Props
//           showEndPopup={showEndPopup}
//           onShowEndPopup={handleShowEndPopup}
//           gameResult={gameResult}
//           onGameResultChange={setGameResult}
//           gameReason={gameReason}
//           onGameReasonChange={setGameReason}
//           playerName={playerName}
//           onPlayerNameChange={setPlayerName}
//           playerRating={playerRating}
//           onPlayerRatingChange={setPlayerRating}
//           ratingChange={ratingChange}
//           onRatingChangeChange={setRatingChange}
//           mistakes={mistakes}
//           onMistakesChange={setMistakes}
//           blunders={blunders}
//           onBlundersChange={setBlunders}
//           greatMoves={greatMoves}
//           onGreatMovesChange={setGreatMoves}
//           // Game Start Popup Props
//           showStartPopup={showStartPopup}
//           onShowStartPopup={handleShowStartPopup}
//           gameMode={gameMode}
//           onGameModeChange={setGameMode}
//           timeControl={timeControl}
//           onTimeControlChange={setTimeControl}
//           gameUrl={gameUrl}
//           onGameUrlChange={setGameUrl}
//           opponentName={opponentName}
//           onOpponentNameChange={setOpponentName}
//           opponentRating={opponentRating}
//           onOpponentRatingChange={setOpponentRating}
//         />
//       </GameBoardLayout>
      
//       <GameEndModal
//         isOpen={showEndPopup}
//         onClose={handleCloseEndPopup}
//         result={gameResult}
//         reason={gameReason}
//         playerName={playerName}
//         playerRating={playerRating}
//         ratingChange={ratingChange}
//         mistakes={mistakes}
//         blunders={blunders}
//         greatMoves={greatMoves}
//         onReviewGame={handleReviewGame}
//         onNewGame={handleNewGame}
//         onRematch={handleRematch}
//       />

//       <GameStartModal
//         open={showStartPopup}
//         onOpenChange={handleCloseStartPopup}
//         gameMode={gameMode}
//         timeControl={timeControl}
//         playerRating={playerRating}
//         opponentName={opponentName}
//         opponentRating={opponentRating}
//         gameUrl={gameUrl}
//         onCancel={handleCloseStartPopup}
//         myName={myName}
//         myPfp={myPfp}
//       />
//     </>
//   )
// }
