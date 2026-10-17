'use client'
import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { MarketingButton, REGISTER_URL } from './ui'

const links = [{ href: '/produit', label: 'Produit' }, { href: '/exemple', label: 'Exemple' }, { href: '/pricing', label: 'Tarifs' }]

export function MarketingNavbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { const update = () => setScrolled(window.scrollY > 8); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update) }, [])
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); menuRef.current?.focus() } }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [])
  const linkClass = (href: string) => `rounded-md px-3 py-2 text-sm hover:bg-elevated ${pathname === href ? 'font-semibold text-ink-primary' : 'text-ink-secondary'}`
  return <header className={`sticky top-0 z-50 border-b bg-surface/95 ${scrolled || open ? 'border-border-strong' : 'border-transparent'}`}>
    <nav aria-label="Navigation principale" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-5">
      <Link href="/" aria-label="Qualio, accueil" className="flex items-center gap-2.5"><img src="/qualio-logo/export/mark/monogram-orange.svg" alt="" className="h-7 w-7 shrink-0" /><span className="text-[18px] font-bold tracking-tight text-ink-primary">Qualio</span></Link>
      <div className="hidden items-center gap-1 md:flex">{links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined} className={linkClass(link.href)}>{link.label}</Link>)}</div>
      <div className="flex items-center gap-2"><Link href="/login" className="hidden rounded-md px-3 py-2 text-sm text-ink-secondary hover:bg-elevated sm:inline-flex">Se connecter</Link><Link href={REGISTER_URL} className="inline-flex min-h-10 items-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover"><span className="hidden lg:inline">Commencer gratuitement</span><span className="lg:hidden">Commencer</span></Link><button ref={menuRef} type="button" aria-expanded={open} aria-controls="marketing-mobile-menu" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-primary hover:bg-elevated md:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button></div>
    </nav>
    {open && <nav id="marketing-mobile-menu" aria-label="Navigation mobile" className="border-t border-border-strong bg-surface px-5 py-3 md:hidden">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={pathname === link.href ? 'page' : undefined} className={`block min-h-11 ${linkClass(link.href)}`}>{link.label}</Link>)}<Link href="/login" onClick={() => setOpen(false)} className="block min-h-11 rounded-md px-3 py-3 text-sm text-ink-secondary sm:hidden">Se connecter</Link></nav>}
  </header>
}

export function MarketingFooter() {
  return <footer className="border-t border-border-strong bg-surface"><div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 lg:flex-row lg:items-center lg:justify-between"><div><Link href="/" aria-label="Qualio, accueil" className="inline-flex items-center gap-2.5"><img src="/qualio-logo/export/mark/monogram-orange.svg" alt="" className="h-7 w-7 shrink-0" /><span className="text-[18px] font-bold tracking-tight text-ink-primary">Qualio</span></Link><p className="mt-3 text-sm text-ink-secondary">Les avis à l’appui de vos décisions.</p></div><nav aria-label="Pied de page" className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-ink-secondary">{[['/#faq', 'FAQ'], ['/contact', 'Contact'], ['/confidentialite', 'Confidentialité'], ['/conditions', 'Conditions'], ['/mentions-legales', 'Mentions légales']].map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center hover:text-ink-primary">{label}</Link>)}</nav><p className="text-xs text-ink-secondary">© 2026 Qualio</p></div></footer>
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return <div className="qualio-marketing min-h-screen bg-surface font-sans text-ink-primary"><MarketingNavbar />{children}<MarketingFooter /></div>
}

export function MarketingFinalCTA() {
  return <section className="mx-auto max-w-6xl px-5 py-16"><div className="rounded-xl bg-ink-primary px-6 py-14 text-center text-surface sm:px-12"><h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Transformez chaque avis en prochaine décision.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 opacity-75">Importez vos avis. Vérifiez ce qui revient, puis choisissez votre prochaine action.</p><div className="mt-8"><MarketingButton href={REGISTER_URL}>Commencer gratuitement</MarketingButton></div></div></section>
}
