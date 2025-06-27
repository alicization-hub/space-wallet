'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef } from 'react'

type Star = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  phase: number
  zone: number
  twinkleSpeed: number
  driftSpeed: number
  opacity: {
    base: number
    min: number
    max: number
  }
}

export default function TwinklingStars() {
  // __STATE's
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(-1)

  const stars = useMemo<Star[]>(() => {
    const [width, height] = [window.innerWidth, window.innerHeight]

    return Array.from({ length: 480 }, () => {
      const driftSpeed = Math.random() * 0.25
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * driftSpeed,
        vy: (Math.random() - 0.5) * driftSpeed,
        radius: Math.random() * 0.75,
        phase: Math.random() * Math.PI * 2,
        zone: Math.floor(Math.random() * 4),
        twinkleSpeed: Math.random() * 0.08,
        driftSpeed,
        opacity: {
          base: Math.random() * 0.97,
          min: Math.random() * 0.5,
          max: Math.random() * 1
        }
      }
    })
  }, [])

  // __FUNCTION's
  const createAnimate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return void 0

    const ctx = canvas.getContext('2d')
    if (!ctx) return void 0

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const time = performance.now() * 0.002
    for (const star of stars) {
      star.x = (star.x + star.vx + canvas.width) % canvas.width
      star.y = (star.y + star.vy + canvas.height) % canvas.height

      const orbitalInfluence = Math.sin(time * 0.1 + star.phase) * 0.02
      star.x += Math.cos(time * star.driftSpeed + star.phase) * orbitalInfluence
      star.y += Math.sin(time * star.driftSpeed + star.phase) * orbitalInfluence

      const zoneOffset = star.zone * Math.PI * 0.5
      const twinkleEffect =
        Math.sin(time + zoneOffset) * 0.3 + Math.sin(time * star.twinkleSpeed + star.phase) * 0.4
      const opacity = Math.max(
        star.opacity.min,
        Math.min(star.opacity.max, star.opacity.base + twinkleEffect * (star.opacity.max - star.opacity.min))
      )

      ctx.beginPath()
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fill()

      if (opacity > 0.5) {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`
        ctx.fill()
      }
    }

    animationRef.current = requestAnimationFrame(createAnimate)
  }, [])

  // __EFFECT's
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      createAnimate()

      return () => {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [createAnimate])

  // __RENDER
  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
      className='absolute inset-0 z-[1] size-full'
      style={{
        maskImage: `radial-gradient(circle at top, #0a0a0a, transparent)`
      }}
    />
  )
}
