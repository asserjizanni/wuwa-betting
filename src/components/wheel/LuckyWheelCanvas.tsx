import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { LuckyWheelPrize } from '../../types/luckyWheel'
import { playWheelTickSound } from '../../lib/audio'

interface LuckyWheelCanvasProps {
  prizes: LuckyWheelPrize[]
  isSpinning: boolean
  targetIndex: number | null
  onSpinEnd: () => void
  size?: number
}

// Slice color palettes if not individually specified
const PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#f97316', // Orange
]

export function LuckyWheelCanvas({
  prizes,
  isSpinning,
  targetIndex,
  onSpinEnd,
  size = 460
}: LuckyWheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const currentAngleRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const lastTickSegmentRef = useRef<number>(-1)
  const [lightsTick, setLightsTick] = useState(0)

  // Pulsing perimeter lights
  useEffect(() => {
    const interval = setInterval(() => {
      setLightsTick(prev => (prev + 1) % 12)
    }, 250)
    return () => clearInterval(interval)
  }, [])

  // Draw wheel on canvas
  const drawWheel = useCallback((angleRad: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = size
    const height = size
    const radius = width / 2 - 24
    const center = width / 2

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    // Outer glow ring
    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, radius + 14, 0, Math.PI * 2)
    const glowGradient = ctx.createRadialGradient(center, center, radius, center, center, radius + 18)
    glowGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)')
    glowGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.25)')
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glowGradient
    ctx.fill()
    ctx.restore()

    // Outer rim border
    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, radius + 10, 0, Math.PI * 2)
    ctx.lineWidth = 8
    ctx.strokeStyle = '#1e1b4b'
    ctx.stroke()
    ctx.restore()

    // Outer golden decorative ring
    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, radius + 4, 0, Math.PI * 2)
    ctx.lineWidth = 3
    ctx.strokeStyle = '#fbbf24'
    ctx.shadowColor = '#f59e0b'
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.restore()

    const numSlices = Math.max(1, prizes.length)
    const sliceAngle = (Math.PI * 2) / numSlices

    // Draw Slices
    ctx.save()
    ctx.translate(center, center)
    ctx.rotate(angleRad)

    for (let i = 0; i < numSlices; i++) {
      const prize = prizes[i]
      const startAngle = i * sliceAngle
      const endAngle = startAngle + sliceAngle

      // Slice Path
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radius, startAngle, endAngle)
      ctx.closePath()

      // Gradient Fill for Slice
      const sliceColor = prize.color || PALETTE[i % PALETTE.length]
      const radGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, radius)
      radGrad.addColorStop(0, '#0a0a14')
      radGrad.addColorStop(0.55, sliceColor + 'cc')
      radGrad.addColorStop(1, sliceColor)
      ctx.fillStyle = radGrad
      ctx.fill()

      // Slice border line
      ctx.lineWidth = 1.5
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.stroke()

      // Draw Slice Content (Text & Icons)
      ctx.save()
      ctx.rotate(startAngle + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'

      // Prize Name / Value
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 4
      ctx.font = 'bold 12px Cairo, sans-serif'

      const displayName = prize.name.length > 18 ? prize.name.substring(0, 16) + '..' : prize.name
      ctx.fillText(displayName, radius - 26, 0)

      // Mini badge / icon symbol
      ctx.font = '10px Cairo, sans-serif'
      ctx.fillStyle = prize.is_legendary ? '#fbbf24' : prize.is_rare ? '#38bdf8' : 'rgba(255,255,255,0.7)'
      if (prize.prize_type === 'dollars') {
        ctx.fillText(`+$${prize.prize_value}`, radius - 26, 16)
      } else if (prize.prize_type === 'card') {
        ctx.fillText('بطاقة', radius - 26, 16)
      } else if (prize.prize_type === 'title') {
        ctx.fillText('لقب', radius - 26, 16)
      }

      ctx.restore()
    }

    ctx.restore() // Restore translate/rotate for slices

    // Draw perimeter LED dots
    const totalDots = 24
    for (let d = 0; d < totalDots; d++) {
      const dotAngle = (d / totalDots) * (Math.PI * 2)
      const dotX = center + Math.cos(dotAngle) * (radius + 8)
      const dotY = center + Math.sin(dotAngle) * (radius + 8)
      const isActiveLight = (d + lightsTick) % 3 === 0

      ctx.beginPath()
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
      ctx.fillStyle = isActiveLight ? '#fef08a' : '#475569'
      if (isActiveLight) {
        ctx.shadowColor = '#facc15'
        ctx.shadowBlur = 8
      } else {
        ctx.shadowBlur = 0
      }
      ctx.fill()
    }

    // Center Golden Hub
    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, 38, 0, Math.PI * 2)
    const hubGrad = ctx.createRadialGradient(center, center, 5, center, center, 38)
    hubGrad.addColorStop(0, '#fef08a')
    hubGrad.addColorStop(0.4, '#eab308')
    hubGrad.addColorStop(0.8, '#a16207')
    hubGrad.addColorStop(1, '#451a03')
    ctx.fillStyle = hubGrad
    ctx.shadowColor = '#fbbf24'
    ctx.shadowBlur = 14
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#fef08a'
    ctx.stroke()

    // Inner ring
    ctx.beginPath()
    ctx.arc(center, center, 24, 0, Math.PI * 2)
    ctx.fillStyle = '#0f172a'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#eab308'
    ctx.stroke()

    // Center Star / Symbol
    ctx.fillStyle = '#fef08a'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#f59e0b'
    ctx.shadowBlur = 8
    ctx.fillText('✦', center, center)
    ctx.restore()

  }, [prizes, size, lightsTick])

  // Spin animation loop
  useEffect(() => {
    if (!isSpinning || targetIndex === null || prizes.length === 0) return

    const numSlices = prizes.length
    const sliceAngle = (Math.PI * 2) / numSlices

    // Top pointer is at -Math.PI / 2 (270 deg)
    // To land targetIndex under pointer:
    // angle + targetIndex * sliceAngle + sliceAngle/2 = 3 * Math.PI / 2 + k * 2*PI
    const pointerAngle = -Math.PI / 2
    const sliceCenterAngle = targetIndex * sliceAngle + sliceAngle / 2
    
    // Add jitter within the segment so it doesn't land at the exact micro-pixel every time
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.5)

    const startAngle = currentAngleRef.current
    const fullSpins = 6 * (Math.PI * 2) // 6 full rotations minimum
    const destinationAngle = startAngle + fullSpins + ((pointerAngle - (startAngle % (Math.PI * 2)) - sliceCenterAngle + jitter + (Math.PI * 8)) % (Math.PI * 2))

    const duration = 5400 // ms
    const startTime = performance.now()

    // Quintic ease-out curve for dramatic tension
    const easeOutQuint = (x: number): number => {
      return 1 - Math.pow(1 - x, 5)
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / duration)
      const easedProgress = easeOutQuint(progress)

      const currentAngle = startAngle + (destinationAngle - startAngle) * easedProgress
      currentAngleRef.current = currentAngle

      // Calculate which slice is currently passing under the pointer to trigger sound tick
      const normalizedAngle = (currentAngle % (Math.PI * 2) + (Math.PI * 2)) % (Math.PI * 2)
      const currentSegment = Math.floor(((pointerAngle - normalizedAngle + (Math.PI * 4)) % (Math.PI * 2)) / sliceAngle)
      if (currentSegment !== lastTickSegmentRef.current) {
        lastTickSegmentRef.current = currentSegment
        // Play tick sound with velocity-dependent pitch
        const velocity = 1 - progress
        if (velocity > 0.05) {
          playWheelTickSound(0.9 + velocity * 0.4)
        }
      }

      drawWheel(currentAngle)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Spin finished!
        currentAngleRef.current = destinationAngle
        drawWheel(destinationAngle)
        onSpinEnd()
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSpinning, targetIndex, prizes, drawWheel, onSpinEnd])

  // Initial render & resize
  useEffect(() => {
    drawWheel(currentAngleRef.current)
  }, [drawWheel])

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Top Pointer Indicator */}
      <div 
        className="absolute top-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)]"
      >
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
          <path
            d="M17 40L3 10C1 6 3 2 7 2H27C31 2 33 6 31 10L17 40Z"
            fill="url(#pointerGoldGrad)"
            stroke="#fef08a"
            strokeWidth="2"
          />
          <circle cx="17" cy="12" r="5" fill="#451a03" stroke="#fef08a" strokeWidth="1.5" />
          <defs>
            <linearGradient id="pointerGoldGrad" x1="17" y1="2" x2="17" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.3" stopColor="#eab308" />
              <stop offset="0.7" stopColor="#ca8a04" />
              <stop offset="1" stopColor="#78350f" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wheel Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full shadow-2xl transition-transform"
      />
    </div>
  )
}
