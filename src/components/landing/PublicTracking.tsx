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

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY)
    if (saved === 'accepted' || saved === 'refused') setConsent(saved)
  }, [])

  useEffect(() => {
    if (consent !== 'accepted') return
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

  if (consent) return null
  return <aside role="dialog" aria-label="Préférences de mesure d’audience" className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-[#e6e6ea] bg-white p-5 shadow-[0_18px_55px_rgba(11,11,12,0.16)] sm:flex-row sm:items-center sm:justify-between sm:gap-8">
    <p className="text-sm leading-6 text-[#62626b]">Qualio mesure uniquement les visites et les clics essentiels pour améliorer le site. Aucun outil publicitaire ni profilage.</p>
    <div className="flex shrink-0 gap-2"><button type="button" onClick={() => choose('refused')} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-[#62626b] hover:bg-[#f6f6f7]">Refuser</button><button type="button" onClick={() => choose('accepted')} className="min-h-10 rounded-lg bg-[#18181b] px-3 text-xs font-semibold text-white hover:bg-black">Accepter</button></div>
  </aside>
}
