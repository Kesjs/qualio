"use client"

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const C = {
  canvas: '#f8faf9', surface: '#ffffff', line: '#dfe6e2',
  ink: '#17201d', orange: '#ee6018', muted: '#68736f', subtle: '#98a29d',
}

const REVIEW_EXAMPLES = [
  { quote: 'La création de compte est claire, mais le formulaire est trop long.', source: 'SaaS', rating: 4 },
  { quote: 'J’ai trouvé ce que je cherchais, mais le prix manque de contexte.', source: 'E-commerce', rating: 3 },
  { quote: 'L’application est fluide et j’ai trouvé la réponse en quelques secondes.', source: 'Mobile', rating: 5 },
  { quote: 'Le support a été rapide, mais les étapes de suivi restent difficiles à comprendre.', source: 'Support', rating: 4 },
]

function ProductVisual() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className={`auth-review-panel${shouldReduceMotion ? ' is-reduced' : ''}`} aria-label="Aperçu d’avis clients d’exemple">
      <div className="auth-review-stage">
        <div className="auth-review-row">
          <div className="auth-review-track">
            {[...REVIEW_EXAMPLES, ...REVIEW_EXAMPLES].map((review, index) => (
              <article className="auth-review-card" key={`${review.source}-${index}`} aria-hidden={index >= REVIEW_EXAMPLES.length}>
                <div className="auth-review-card-top">
                  <span className="auth-review-card-label">Avis d’exemple</span>
                    <span className="auth-review-stars" aria-label={`${review.rating} étoiles sur 5`}>
                      <span aria-hidden="true">{'★'.repeat(review.rating)}<span className="auth-review-stars-muted">{'★'.repeat(5 - review.rating)}</span></span>
                    </span>
                </div>
                <p className="auth-review-quote">“{review.quote}”</p>
                <span className="auth-review-source">{review.source}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="auth-review-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="auth-review-grid-card" key={index}><span /><span /><span /></div>
          ))}
        </div>
      </div>
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
            letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink,
          }}>Qualio</span>
        </div>
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
                style={{ position: 'absolute', color: C.ink, display: 'flex' }}
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
                  fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.ink,
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
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink,
                  whiteSpace: 'nowrap', display: 'block'
                }}
              >
                Qualio
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Link>
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
      color: C.ink,
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
            letterSpacing: '-0.025em', color: C.ink, margin: '0 0 8px',
            lineHeight: 1.1,
          }}>
            {title}
          </h1>
          <p style={{
            fontFamily: "'Manrope',sans-serif", fontSize: 14,
            color: C.muted, margin: '0 0 32px', lineHeight: 1.5,
          }}>
            {description}
          </p>
          {children}
        </motion.div>

        {/* Footer */}
        <p style={{
          position: 'absolute', bottom: 24,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
          color: C.subtle, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          © 2026 Qualio · <a href="/privacy" style={{ color: C.subtle, textDecoration: 'none' }}>Privacy</a> · <a href="/terms" style={{ color: C.subtle, textDecoration: 'none' }}>Terms</a>
        </p>
      </div>

      {/* Right — Product visual (desktop only) */}
      <div style={{
        width: '44%', background: C.canvas,
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
          color: C.muted, letterSpacing: '-0.01em',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          style={{
            width: '100%',
            background: C.surface,
            border: `1px solid ${error ? '#ef4444' : C.line}`,
            borderRadius: 3,
            padding: rightEl ? '9px 40px 9px 12px' : '9px 12px',
            fontFamily: "'Manrope',sans-serif",
            fontSize: 14,
            color: C.ink,
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
            e.target.style.borderColor = error ? '#ef4444' : C.line
            props.onBlur?.(e)
          }}
        />
        {rightEl && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', color: C.muted, cursor: 'pointer',
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
        border: isPrimary ? 'none' : `1px solid ${C.line}`,
        background: isPrimary ? C.orange : 'transparent',
        color: isPrimary ? '#ffffff' : C.ink,
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
              border: `2px solid ${isPrimary ? C.line : C.muted}`,
              borderTopColor: isPrimary ? '#ffffff' : C.ink,
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
      <div style={{ flex: 1, height: 1, background: C.line }} />
      <span style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
        color: C.subtle, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.line }} />
    </div>
  )
}
