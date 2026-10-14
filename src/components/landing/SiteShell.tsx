'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ACCENT_INK, FOCUS, INK, LINE, MUTED, R_BUTTON, SIGNUP } from './tokens'

/** Les trois destinations de la barre (section 4.8) : comprendre, voir, acheter. */
const NAV_LINKS = [
  { href: '/produit', label: 'Produit' },
  { href: '/exemple', label: 'Exemple' },
  { href: '/pricing', label: 'Tarifs' },
] as const

function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => setIsAuthenticated(Boolean(user))).catch(() => setIsAuthenticated(false))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user))
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header
      className="sticky top-0 z-50 bg-white/85 backdrop-blur-md"
      style={{ borderBottom: `1px solid ${scrolled || open ? LINE : 'transparent'}` }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5" aria-label="Navigation principale">
        <Link href="/" className={`flex items-center ${R_BUTTON} ${FOCUS}`} aria-label="Qualio, accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qualio-logo/export/lockup/lockup-light.svg" alt="Qualio" className="h-7" />
        </Link>

        <div className="hidden items-center gap-1 text-[14px] md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`px-3.5 py-2 transition hover:bg-[#f4f4f5] ${R_BUTTON} ${FOCUS} ${active ? 'bg-[#f4f4f5] font-semibold' : ''}`}
                style={{ color: active ? INK : MUTED }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-1">
          {isAuthenticated ? <Link href="/dashboard" className={`px-4 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90 ${R_BUTTON} ${FOCUS}`} style={{ background: ACCENT_INK }}>Mon espace</Link> : <>
            <Link href="/login" className={`hidden px-3.5 py-2 text-[14px] transition hover:bg-[#f4f4f5] sm:inline ${R_BUTTON} ${FOCUS}`} style={{ color: MUTED }}>Se connecter</Link>
            <Link href={SIGNUP} className={`px-4 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90 ${R_BUTTON} ${FOCUS}`} style={{ background: ACCENT_INK }}><span className="sm:hidden">Commencer</span><span className="hidden sm:inline">Commencer gratuitement</span></Link>
          </>}
          <button
            type="button"
            className={`ml-1 flex h-10 w-10 items-center justify-center md:hidden ${R_BUTTON} ${FOCUS}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t bg-white px-5 py-3 md:hidden" style={{ borderColor: LINE }}>
          {[...NAV_LINKS, ...(isAuthenticated ? [{ href: '/dashboard', label: 'Mon espace' }] : [{ href: '/login', label: 'Se connecter' }])].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`block px-3 py-3 text-[16px] hover:bg-[#f4f4f5] ${R_BUTTON} ${FOCUS}`}
              style={{ color: INK, fontWeight: isActive(href) ? 600 : 400 }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}

function Footer() {
  const groups = [
    {
      title: 'Qualio',
      links: [
        { href: '/produit', label: 'Produit' },
        { href: '/exemple', label: 'Exemple' },
        { href: '/pricing', label: 'Tarifs' },
        { href: '/#faq', label: 'Questions fréquentes' },
      ],
    },
    {
      title: 'Aide et légal',
      links: [
        { href: '/contact', label: 'Contact' },
        { href: '/confidentialite', label: 'Confidentialité' },
        { href: '/conditions', label: 'Conditions d’utilisation' },
        { href: '/mentions-legales', label: 'Mentions légales' },
      ],
    },
  ]
  return (
    <footer className="border-t" style={{ borderColor: LINE }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qualio-logo/export/lockup/lockup-light.svg" alt="Qualio" className="h-7" />
          <p className="mt-3 max-w-xs text-sm" style={{ color: MUTED }}>Une vue fiable des avis qui comptent.</p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: INK }}>{g.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm" style={{ color: MUTED }}>
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={`hover:text-[#ee6018] ${FOCUS}`}>{l.label}</Link>
                </li>
              ))}
              {g.title === 'Qualio' && (
                <li>
                  <Link href="/login" className={`hover:text-[#ee6018] ${FOCUS}`}>Se connecter</Link>
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t" style={{ borderColor: LINE }}>
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs" style={{ color: MUTED }}>© 2026 Qualio</p>
      </div>
    </footer>
  )
}

/** Cadre commun des pages publiques : barre, contenu, pied de page. */
export function SiteShell({ children }: { children: ReactNode }) {
  // Le thème sombre par défaut laisse un fond noir visible au rebond (iOS) : on force le blanc sur ces pages.
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.backgroundColor
    root.style.backgroundColor = '#fff'
    return () => { root.style.backgroundColor = previous }
  }, [])

  return (
    // « Réduire les animations » : désactive aussi les transformations Framer Motion (doc 3.9, point 5).
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white font-sans" style={{ color: INK, scrollBehavior: 'smooth' }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
