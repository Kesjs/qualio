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
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (typeof document === 'undefined' || !('fonts' in document)) {
      setFontsReady(true)
      return
    }
    document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const element = textRef.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      setSize({ width: Math.ceil(rect.width) + 2, height: Math.ceil(rect.height) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [text, className, fontsReady])

  useEffect(() => {
    const probe = document.createElement('span')
    probe.className = cn('pointer-events-none absolute h-0 w-0 opacity-0', backgroundClassName)
    document.body.appendChild(probe)
    setBackground(getComputedStyle(probe).backgroundColor || '#ee6018')
    probe.remove()
  }, [backgroundClassName])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.width || !size.height || !textRef.current || !fontsReady) return
    const context = canvas.getContext('2d')
    if (!context) return

    const ratio = window.devicePixelRatio || 1
    canvas.width = size.width * ratio
    canvas.height = size.height * ratio
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`
    context.setTransform(ratio, 0, 0, ratio, 0, 0)

    const computed = getComputedStyle(textRef.current)
    const fontString = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize}/${computed.lineHeight} ${computed.fontFamily}`
    context.font = fontString

    if ('letterSpacing' in context) {
      ;(context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = computed.letterSpacing
    }
    const lineHeightPx = parseFloat(computed.lineHeight) || size.height

    if (reducedMotion) {
      context.fillStyle = background
      context.fillRect(0, 0, size.width, size.height)
      context.globalCompositeOperation = 'destination-in'
      context.font = fontString
      context.textBaseline = 'top'
      context.fillStyle = '#000'
      const staticLines = getWrappedLines(context, text, size.width - 2)
      staticLines.forEach((line, i) => context.fillText(line, 0, i * lineHeightPx))
      context.globalCompositeOperation = 'source-over'
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
      context.font = fontString
      context.textBaseline = 'top'
      context.fillStyle = '#000'
      const lines = getWrappedLines(context, text, size.width - 2)
      lines.forEach((line, i) => context.fillText(line, 0, i * lineHeightPx))
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
  }, [animationDuration, background, colors, curveIntensity, fontsReady, lineGap, lineWidth, reducedMotion, size, text])

  return (
    <span className={cn('relative inline-block align-baseline max-w-full', className)}>
      {/* ← FIX : sur mobile, le canvas est masqué en CSS pur (`hidden md:inline-block`)
          au profit d'un simple texte coloré, toujours garanti visible, sans dépendre
          du chargement de police / de la fiabilité de context.font sur mobile Safari.
          L'effet canvas animé reste utilisé tel quel en desktop. */}
      <span className="hidden md:inline-block relative">
        <span
          ref={textRef}
          className="invisible inline-block max-w-full whitespace-normal break-words"
          aria-hidden="true"
        >
          {text}
        </span>
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
      </span>
      <span className="md:hidden" style={{ color: background }}>
        {text}
      </span>
    </span>
  )
}

function getWrappedLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (context.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}

export default CanvasText
