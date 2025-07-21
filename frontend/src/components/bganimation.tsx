"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface Circle {
  id: string
  x: number // percentage of width
  size: number // px
  duration: number // seconds
  delay: number // seconds
  color: "red" | "yellow"
}

const generateRandomCircle = (id: number): Circle => {
  const size = Math.random() * (80 - 20) + 20 // Size between 20px and 80px
  const duration = Math.random() * (15 - 8) + 8 // Duration between 8s and 15s
  const x = Math.random() * 100 // X position as percentage
  const color = Math.random() > 0.5 ? "red" : "yellow"
  const delay = Math.random() * 5 // Initial delay up to 5s

  return {
    id: `circle-${id}`,
    x,
    size,
    duration,
    delay,
    color,
  }
}

export function FallingCirclesBackground() {
  const [circles, setCircles] = useState<Circle[]>([])
  const numCircles = 20 // Number of circles to display

  useEffect(() => {
    const initialCircles: Circle[] = []
    for (let i = 0; i < numCircles; i++) {
      initialCircles.push(generateRandomCircle(i))
    }
    setCircles(initialCircles)
  }, [])

  const handleAnimationComplete = (id: string) => {
    setCircles((prevCircles) =>
      prevCircles.map((circle) =>
        circle.id === id ? generateRandomCircle(Number.parseInt(id.split("-")[1])) : circle,
      ),
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {circles.map((circle) => (
        <motion.div
          key={circle.id}
          className={`absolute rounded-full opacity-50 ${
            circle.color === "red" ? "bg-brand-accent-red" : "bg-brand-accent-yellow"
          }`}
          style={{
            width: circle.size,
            height: circle.size,
            left: `${circle.x}vw`,
            top: `-10%`, // Start above the viewport
          }}
          initial={{ y: 0 }}
          animate={{ y: "110vh" }} // Fall to 110vh (off-screen bottom)
          transition={{
            duration: circle.duration,
            delay: circle.delay,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
          onAnimationComplete={() => handleAnimationComplete(circle.id)}
        />
      ))}
    </div>
  )
}
