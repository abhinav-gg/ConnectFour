"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"

interface Circle {
  id: string
  x: number // percentage of width
  size: number // px
  velocity: number // pixels per second
  color: "red" | "yellow"
  isHovered: boolean
  currentY: number
}

const generateRandomCircle = (id: number): Circle => {
  const size = Math.random() * (80 - 20) + 20 // Size between 20px and 80px
  const velocity = Math.random() * (100 - 50) + 50 // Velocity between 50-100 px/s
  const x = Math.random() * 100 // X position as percentage
  const color = Math.random() > 0.5 ? "red" : "yellow"

  return {
    id: `circle-${id}`,
    x,
    size,
    velocity,
    color,
    isHovered: false,
    currentY: -size, // Start just above viewport (negative size)
  }
}

export function FallingCirclesBackground() {
  const [, forceUpdate] = useState({})
  const containerRef = useRef<HTMLDivElement>(null)
  const circlesRef = useRef<Circle[]>([])
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(Date.now())
  const numCircles = 20

  // Force a re-render
  const triggerUpdate = () => forceUpdate({})

  useEffect(() => {
    const initialCircles: Circle[] = []
    for (let i = 0; i < numCircles; i++) {
      const circle = generateRandomCircle(i)
      circle.currentY = -circle.size - (i * 100) // Stagger initial spawning
      initialCircles.push(circle)
    }
    circlesRef.current = initialCircles
    triggerUpdate()
  }, [])

  useEffect(() => {
    let throttleTimer: NodeJS.Timeout | null = null
    
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle mouse updates to reduce CPU usage
      if (throttleTimer) return
      
      throttleTimer = setTimeout(() => {
        throttleTimer = null
        mousePositionRef.current = { x: e.clientX, y: e.clientY }
        
        // Update hover states
        let hasChanges = false
        circlesRef.current.forEach(circle => {
          const wasHovered = circle.isHovered
          circle.isHovered = checkOverlap(circle, e.clientX, e.clientY)
          if (wasHovered !== circle.isHovered) {
            hasChanges = true
          }
        })
        
        if (hasChanges) {
          triggerUpdate()
        }
      }, 16) // ~60fps throttling
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (throttleTimer) {
        clearTimeout(throttleTimer)
      }
    }
  }, [])

  const checkOverlap = (circle: Circle, mouseX: number, mouseY: number) => {
    const circleX = (circle.x / 100) * window.innerWidth
    const circleY = circle.currentY
    const radius = circle.size / 2
    
    const distance = Math.sqrt(
      Math.pow(mouseX - (circleX + radius), 2) + Math.pow(mouseY - (circleY + radius), 2)
    )
    
    return distance <= radius
  }

  // Animation loop for velocity-based movement
  useEffect(() => {
    let frameCount = 0
    
    const animate = () => {
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTimeRef.current) / 1000
      lastTimeRef.current = currentTime

      // Skip updates if deltaTime is too small (avoid micro-movements)
      if (deltaTime < 0.008) { // ~120fps cap
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      let hasChanges = false
      frameCount++
      
      circlesRef.current.forEach((circle, index) => {
        if (circle.isHovered) {
          return // Don't move hovered circles
        }

        const newY = circle.currentY + (circle.velocity * deltaTime)
        
        // Remove circles that have fallen off screen
        if (newY > window.innerHeight + circle.size) {
          circlesRef.current[index] = generateRandomCircle(index)
          hasChanges = true
        } else if (Math.abs(newY - circle.currentY) > 1) { // Only update if movement > 1px
          circle.currentY = newY
          hasChanges = true
        }
      })

      // Only trigger updates every few frames to reduce React renders
      if (hasChanges && frameCount % 2 === 0) { // Update every 2nd frame (~30fps React updates)
        triggerUpdate()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {circlesRef.current.map((circle) => (
        <div
          key={circle.id}
          className={`absolute rounded-full ${
            circle.color === "red" ? "bg-brand-accent-red" : "bg-brand-accent-yellow"
          }`}
          style={{
            width: circle.size,
            height: circle.size,
            left: `${circle.x}vw`,
            top: circle.currentY,
            opacity: circle.isHovered ? 1 : 0.5,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
      ))}
    </div>
  )
}
