"use client"

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const C = {
  canvas: '#000000', carbon: '#0d0d0d', ash: '#222222',
  bone: '#eeeeee', orange: '#ee6018', green: '#a0ca92',
  granite: '#8a8380', graphite: '#4d4947', stone: '#b8b3b0',
}

// Panneau droit — paysage plein écran
function ProductVisual() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#0a0a0a',
    }}>
      <Image
        src="/login-panel.jpg"
        alt="Landscape"
        fill
        priority
        unoptimized
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
    </div>
  )
}

function LogoIcon() {
  return (
    <span style={{
      width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <img src="/qualio-logo/export/mark/monogram-orange.svg" alt="Qualio" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </span>
  )
}

import { LanguageSwitcher } from '../landing/LanguageSwitcher'

function TopLeftBrandNav({ showBack }: { showBack?: boolean }) {
  const [hovered, setHovered] = useState(false)

  if (!showBack) {
    return (
      <div style={{
        position: 'absolute', top: 28, left: 32, right: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoIcon />
          <span style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 400,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: C.bone,
          }}>Qualio</span>
        </div>
        <LanguageSwitcher />
      </div>
    )
  }

  return (
    <div style={{
      position: 'absolute', top: 28, left: 32, right: 32,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 10,
    }}>
      <Link 
        href="/"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', cursor: 'pointer',
          height: 22,
        }}
      >
        <div style={{ position: 'relative', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence initial={false}>
            {hovered ? (
              <motion.div
                key="arrow"
                initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ position: 'absolute', color: C.bone, display: 'flex' }}
              >
                <ArrowLeft size={16} />
              </motion.div>
            ) : (
              <motion.div
                key="logo"
                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ position: 'absolute', display: 'flex' }}
              >
                <LogoIcon />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <AnimatePresence initial={false} mode="wait">
            {hovered ? (
              <motion.span
                key="text-back"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                style={{
                  fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.bone,
                  whiteSpace: 'nowrap', display: 'block'
                }}
              >
                Back to site
              </motion.span>
            ) : (
              <motion.span
                key="text-logo"
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 400,
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: C.bone,
                  whiteSpace: 'nowrap', display: 'block'
                }}
              >
                Qualio
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Link>
      <LanguageSwitcher />
    </div>
  )
}

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
  showBack?: boolean
}

export function AuthLayout({ children, title, description, showBack = false }: AuthLayoutProps) {
  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: C.canvas,
      fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
      color: C.bone,
    }}>
      {/* Left — Form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px 32px', position: 'relative',
      }}>
        {/* Top left brand / back link */}
        <TopLeftBrandNav showBack={showBack} />

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          <h1 style={{
            fontFamily: "'Manrope',sans-serif", fontSize: 28, fontWeight: 400,
            letterSpacing: '-0.025em', color: C.bone, margin: '0 0 8px',
            lineHeight: 1.1,
          }}>
            {title}
          </h1>
          <p style={{
            fontFamily: "'Manrope',sans-serif", fontSize: 14,
            color: C.granite, margin: '0 0 32px', lineHeight: 1.5,
          }}>
            {description}
          </p>
          {children}
        </motion.div>

        {/* Footer */}
        <p style={{
          position: 'absolute', bottom: 24,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
          color: C.graphite, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          © 2026 Qualio · <a href="/privacy" style={{ color: C.graphite, textDecoration: 'none' }}>Privacy</a> · <a href="/terms" style={{ color: C.graphite, textDecoration: 'none' }}>Terms</a>
        </p>
      </div>

      {/* Right — Product visual (desktop only) */}
      <div style={{
        width: '44%', background: C.carbon,
        display: 'none', // géré par media query via globals.css
      }}
        className="auth-right-panel"
      >
        <ProductVisual />
      </div>
    </div>
  )
}

// Input wrapper stylisé Factory
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  rightEl?: ReactNode
}

export function AuthInput({ label, error, rightEl, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{
          fontFamily: "'Manrope',sans-serif", fontSize: 13,
          color: C.stone, letterSpacing: '-0.01em',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          style={{
            width: '100%',
            background: C.carbon,
            border: `1px solid ${error ? '#ef4444' : C.ash}`,
            borderRadius: 3,
            padding: rightEl ? '9px 40px 9px 12px' : '9px 12px',
            fontFamily: "'Manrope',sans-serif",
            fontSize: 14,
            color: C.bone,
            outline: 'none',
            transition: 'border-color 0.15s ease',
            boxSizing: 'border-box',
            ...props.style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = C.orange
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#ef4444' : C.ash
            props.onBlur?.(e)
          }}
        />
        {rightEl && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', color: C.granite, cursor: 'pointer',
          }}>
            {rightEl}
          </span>
        )}
      </div>
      {error && (
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: '#ef4444' }}>{error}</span>
      )}
    </div>
  )
}

// Bouton principal Qualio
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export function AuthButton({ loading, variant = 'primary', children, ...props }: AuthButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        width: '100%',
        padding: '10px 16px',
        borderRadius: 3,
        border: isPrimary ? 'none' : `1px solid ${C.ash}`,
        background: isPrimary ? C.bone : 'transparent',
        color: isPrimary ? C.canvas : C.stone,
        fontFamily: "'Manrope',sans-serif",
        fontSize: 14,
        fontWeight: isPrimary ? 500 : 400,
        cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
        opacity: loading || props.disabled ? 0.6 : 1,
        transition: 'background 0.15s ease, opacity 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...props.style,
      }}
    >
      {loading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{
              display: 'inline-block', width: 12, height: 12,
              border: `2px solid ${isPrimary ? C.graphite : C.granite}`,
              borderTopColor: isPrimary ? C.canvas : C.bone,
              borderRadius: '50%',
            }}
          />
          {children}
        </>
      ) : children}
    </button>
  )
}

// Divider "OR"
export function AuthDivider({ label = 'OR' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: C.ash }} />
      <span style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
        color: C.graphite, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.ash }} />
    </div>
  )
}
