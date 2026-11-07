'use client'

import { useEffect, useState } from 'react'

const CONSENT_KEY = 'qualio-public-analytics-consent'
const SESSION_KEY = 'qualio-public-session'

type Consent = 'accepted' | 'refused' | null

function getSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const value = crypto.randomUUID()
  window.sessionStorage.setItem(SESSION_KEY, value)
  return value
}

export function PublicTracking({ widgetKey }: { widgetKey: string }) {
  const [consent, setConsent] = useState<Consent>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY)
    if (saved === 'accepted' || saved === 'refused') {
      setConsent(saved)
      return
    }
    // Le visiteur voit d'abord l'offre : la barre n'apparaît qu'après un court instant.
    const id = window.setTimeout(() => setReady(true), 2500)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (consent !== 'accepted') return
    if (document.cookie.split('; ').includes('qualio_ignore=1')) return
    const sessionId = getSessionId()
    const params = new URLSearchParams(window.location.search)
    const attribution = { acquisitionMessageId: params.get('utm_content'), utmSource: params.get('utm_source'), utmMedium: params.get('utm_medium'), utmCampaign: params.get('utm_campaign'), utmContent: params.get('utm_content') }
    const send = (eventName: 'page_view' | 'cta_clicked', path = window.location.pathname) => {
      void fetch('/api/visitor-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: widgetKey, eventName, sessionId, path, referrer: document.referrer, host: window.location.hostname, consented: true, ...attribution }),
        keepalive: true,
      }).catch(() => undefined)
    }
    send('page_view')
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a,button') : null
      if (!target) return
      const text = target.textContent?.trim().toLowerCase() ?? ''
      const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') ?? '' : ''
      if (href.includes('/login') || href.includes('/pricing') || href.includes('/exemple') || text.includes('commencer') || text.includes('démo') || text.includes('démarrer')) send('cta_clicked')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [consent, widgetKey])

  function choose(value: Exclude<Consent, null>) {
    window.localStorage.setItem(CONSENT_KEY, value)
    setConsent(value)
  }

  if (consent || !ready) return null
  return <aside role="dialog" aria-label="Préférences de mesure d’audience" className="fixed inset-x-3 z-[60] mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-[#e6e6ea] bg-white px-3.5 py-2.5 shadow-[0_8px_30px_rgba(11,11,12,0.14)] sm:inset-x-4 sm:max-w-2xl sm:gap-6 sm:px-4" style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
    <p className="min-w-0 flex-1 text-xs leading-snug text-[#62626b]">Nous mesurons les visites et clics essentiels, sans publicité ni profilage. <a href="/confidentialite" className="font-semibold underline underline-offset-2">En savoir plus</a></p>
    <div className="flex shrink-0 gap-1.5"><button type="button" onClick={() => choose('refused')} className="min-h-9 rounded-lg px-2.5 text-xs font-semibold text-[#62626b] hover:bg-[#f6f6f7]">Refuser</button><button type="button" onClick={() => choose('accepted')} className="min-h-9 rounded-lg bg-[#18181b] px-3 text-xs font-semibold text-white hover:bg-black">Accepter</button></div>
  </aside>
}
