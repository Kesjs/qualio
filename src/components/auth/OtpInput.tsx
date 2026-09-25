"use client"

import { useRef, useState, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const C = {
  canvas: '#000000', carbon: '#0d0d0d', ash: '#222222',
  bone: '#eeeeee', orange: '#ee6018', green: '#a0ca92', graphite: '#4d4947',
}

interface OtpInputProps {
  length?: number
  onComplete: (code: string) => void
  error?: boolean
  success?: boolean
  disabled?: boolean
}

export function OtpInput({
  length = 6,
  onComplete,
  error = false,
  success = false,
  disabled = false,
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const focusInput = useCallback((index: number) => {
    const el = inputRefs.current[index]
    if (el) el.focus()
  }, [])

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const digit = val.slice(-1)
    const newValues = [...values]
    newValues[index] = digit
    setValues(newValues)
    if (digit && index < length - 1) focusInput(index + 1)
    if (newValues.every((v) => v !== '') && digit) onComplete(newValues.join(''))
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (values[index]) {
        const newValues = [...values]
        newValues[index] = ''
        setValues(newValues)
      } else if (index > 0) {
        focusInput(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const newValues = Array(length).fill('')
    pasted.split('').forEach((d, i) => { newValues[i] = d })
    setValues(newValues)
    const focusIndex = Math.min(pasted.length, length - 1)
    focusInput(focusIndex)
    if (pasted.length === length) onComplete(pasted)
  }

  const borderColor = error ? '#ef4444' : success ? C.green : C.ash

  return (
    <motion.div
      animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      style={{ display: 'flex', gap: 8 }}
    >
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: 44,
            height: 52,
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 20,
            fontWeight: 400,
            background: C.carbon,
            border: `1px solid ${val ? C.orange : borderColor}`,
            borderRadius: 3,
            color: C.bone,
            outline: 'none',
            transition: 'border-color 0.15s ease',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.5 : 1,
          }}
        />
      ))}
    </motion.div>
  )
}
