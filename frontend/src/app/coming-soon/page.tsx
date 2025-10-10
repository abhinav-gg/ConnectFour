"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Layout } from "@/components/layouts/mainlayout"
import { FallingCirclesBackground } from "@/components/bganimation"

type QuizQuestion = {
  id: string
  question: string
  choices: string[]
  answerIndex: number
}

// Replace these sample questions with your real content later
const ALL_Qs: QuizQuestion[] = [
  {
    id: "q1",
    question: "Which piece moves in an L-shape — also known as the only exciting thing happening before move 20?",
    choices: ["Knight", "The Horsey, obviously", "Whatever piece Magnus is staring at", "The one that still gives you hope"],
    answerIndex: 2,
  },
  {
    id: "q2",
    question: "How many squares are on a chessboard — not including the emotional black hole players fall into?",
    choices: ["64", "8x8, but somehow still not enough to escape your opponent's ego", "32, like your rating after a blunder", "Too many if you're losing"],
    answerIndex: 3,
  },
  {
    id: "q3",
    question: "What's the only piece that can't move backwards — just like most chess players in personal growth?",
    choices: ["Pawn", "Queen after an argument", "Rook stuck behind pawns forever", "The King, but only emotionally"],
    answerIndex: 0,
  },
  {
    id: "q4",
    question: "What is 'castling' — besides an excuse to delay losing?",
    choices: ["Switching the king and rook", "A sacred ritual to protect the one piece that never fights", "Something you tried to do in check like a true genius", "A move invented to make slow games slower"],
    answerIndex: 1,
  },
  {
    id: "q5",
    question: "Which color moves first — because traditions matter more than your feelings?",
    choices: ["White", "Black, if the universe finally feels fair", "Whoever sighs loudest at the board", "The one with better posture"],
    answerIndex: 1,
  },
  {
    id: "q6",
    question: "What's a 'blunder' — other than entering a tournament with actual chess players?",
    choices: ["A horrible move", "A move so bad it gets its own reaction video", "A tactical masterpiece, if you're delusional", "Something followed by 'oops' and a silent scream"],
    answerIndex: 1,
  },
  {
    id: "q7",
    question: "What happens when your king is in check and you can't fix it — kind of like your life choices?",
    choices: ["Checkmate", "You resign with dignity you never had", "You stare at the board for 10 minutes pretending you have options", "You claim your mouse slipped"],
    answerIndex: 2,
  },
  {
    id: "q8",
    question: "What's it called when a pawn reaches the other side — AKA the one ambitious piece in chess?",
    choices: ["Promotion", "Glow-up", "Finally making mom proud", "Becoming a queen, because gender norms don't apply to pawns"],
    answerIndex: 1,
  },
  {
    id: "q9",
    question: "Which piece is the most powerful — and the most likely to be sacrificed in a 'brilliant' idea?",
    choices: ["Queen", "The opponent's queen — because you blundered yours", "The rook, if you're still playing 2003 tactics", "The bishop, in your personal fanfic"],
    answerIndex: 1,
  },
  {
    id: "q10",
    question: "What is a stalemate — other than a passive-aggressive draw no one asked for?",
    choices: ["A draw where no legal moves remain", "The chess version of 'it's complicated'", "How two players admit they're equally disappointing", "A polite way to not lose, for once"],
    answerIndex: 3,
  }
]


export default function ComingSoonPage() {
  const [questions] = useState<QuizQuestion[]>(ALL_Qs)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const q = questions[index]

  const handleChoose = (i: number) => {
    if (selected !== null) return // already chosen
    setSelected(i)
    setShowAnswer(true)
    if (i === q.answerIndex) setScore((s) => s + 1)

    // advance to next question after a short delay
    setTimeout(() => {
      setSelected(null)
      setShowAnswer(false)
      if (index + 1 < questions.length) setIndex(index + 1)
      else setIndex(index + 1) // will show final screen
    }, 900)
  }

  const restart = () => {
    setIndex(0)
    setScore(0)
    setSelected(null)
    setShowAnswer(false)
  }

  // ELO-like calculation: map fraction correct -> [100, 3500], rounded to nearest 100
  const minElo = 100
  const maxElo = 3500
  const rawElo = questions.length > 0 ? minElo + (score / questions.length) * (maxElo - minElo) : minElo
  const eloRounded = Math.max(minElo, Math.min(maxElo, Math.round(rawElo / 100) * 100))

  return (
    <>
      <FallingCirclesBackground />
      <Layout>
        <div className="py-20 flex justify-center">
          <div className="w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="bg-brand-secondary/80 border border-brand-border/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
            >
              <h1 className="text-3xl font-extrabold mb-2">Are you smarter than a chess player?</h1>
              <p className="text-sm text-brand-muted mb-4">A short, fun multiple-choice quiz. I will set the questions later — replace the SAMPLE_QUESTIONS array in this file.</p>

              {index >= questions.length ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }}>
                    <h2 className="text-2xl font-bold mb-2">All done!</h2>
                    <p className="mb-2">You scored <span className="font-mono bg-white/10 px-2 py-1 rounded">{score}</span> / {questions.length}</p>
                    <p className="mb-4 text-lg">Estimated rating: <span className="font-mono bg-white/10 px-2 py-1 rounded">{eloRounded}</span></p>
                    <div className="flex justify-center gap-3">
                      <button onClick={restart} className="px-4 py-2 rounded-lg bg-brand-accent-yellow text-black font-semibold">Try again</button>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-brand-muted">Question {index + 1} of {questions.length}</div>
                    <div className="text-sm text-brand-muted">Score: {score}</div>
                  </div>

                  <motion.div key={q.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="mb-6">
                    <div className="text-lg font-semibold mb-3">{q.question}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.choices.map((choice, i) => {
                        const isSelected = selected === i
                        const isCorrect = q.answerIndex === i
                        const showCorrect = showAnswer && isCorrect
                        const cls = isSelected
                          ? isCorrect
                            ? "bg-green-500 text-black"
                            : "bg-red-600 text-white/90"
                          : showCorrect
                            ? "bg-green-500 text-black"
                            : "bg-white/5 hover:bg-white/10"

                        return (
                          <motion.button
                            key={i}
                            onClick={() => handleChoose(i)}
                            whileTap={{ scale: 0.98 }}
                            className={`p-3 rounded-lg text-left border border-transparent ${cls} transition-colors duration-150`}
                          >
                            <div className="text-sm font-medium">{choice}</div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>

                </div>
              )}
            </motion.div>
          </div>
        </div>
      </Layout>
    </>
  )
}
