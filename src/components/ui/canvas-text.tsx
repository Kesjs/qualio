'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface CanvasTextProps {
  text: string
  className?: string
  backgroundClassName?: string
  colors?: string[]
  animationDuration?: number
  lineWidth?: number
  lineGap?: number
  curveIntensity?: number
}

export function CanvasText({
  text,
  className,
  backgroundClassName = 'bg-[#ee6018]',
  colors = ['#ffb088', '#ee6018', '#ff7b38', '#d94d12'],
  animationDuration = 8,
  lineWidth = 1.5,
  lineGap = 6,
  curveIntensity = 28,
}: CanvasTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [background, setBackground] = useState('#ee6018')
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const element = textRef.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      setSize({ width: Math.ceil(rect.width), height: Math.ceil(rect.height) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, className])

  useEffect(() => {
    const probe = document.createElement('span')
    probe.className = cn('pointer-events-none absolute h-0 w-0 opacity-0', backgroundClassName)
    document.body.appendChild(probe)
    setBackground(getComputedStyle(probe).backgroundColor || '#ee6018')
    probe.remove()
  }, [backgroundClassName])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.width || !size.height) return
    const context = canvas.getContext('2d')
    if (!context) return

    const ratio = window.devicePixelRatio || 1
    canvas.width = size.width * ratio
    canvas.height = size.height * ratio
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`
    context.setTransform(ratio, 0, 0, ratio, 0, 0)

    if (reducedMotion) {
      context.fillStyle = background
      context.fillRect(0, 0, size.width, size.height)
      return
    }

    const start = performance.now()
    let frame = 0
    const draw = (now: number) => {
      const phase = ((now - start) / 1000 / animationDuration) * Math.PI * 2
      context.clearRect(0, 0, size.width, size.height)
      context.fillStyle = background
      context.fillRect(0, 0, size.width, size.height)
      context.globalCompositeOperation = 'destination-in'
      context.font = getComputedStyle(textRef.current!).font
      context.textBaseline = 'top'
      context.fillStyle = '#000'
      context.fillText(text, 0, 0)
      context.globalCompositeOperation = 'source-atop'
      for (let index = -2; index < Math.ceil(size.height / lineGap) + 2; index += 1) {
        const y = index * lineGap
        const curve = Math.sin(phase + index * 0.2) * curveIntensity
        context.beginPath()
        context.moveTo(0, y)
        context.bezierCurveTo(size.width * 0.32, y + curve, size.width * 0.68, y - curve * 0.6, size.width, y)
        context.strokeStyle = colors[index % colors.length]
        context.lineWidth = lineWidth
        context.stroke()
      }
      context.globalCompositeOperation = 'source-over'
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [animationDuration, background, colors, curveIntensity, lineGap, lineWidth, reducedMotion, size, text])

  return (
    <span className={cn('relative inline-block align-baseline', className)}>
      <span ref={textRef} className="invisible inline-block" aria-hidden="true">{text}</span>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </span>
  )
}

export default CanvasText
