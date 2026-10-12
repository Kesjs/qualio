'use client'

import { useCallback, useEffect, useState } from 'react'

const PROJECT_KEY = 'qualio:selected-site'
const PERIOD_KEY = 'qualio:period-days'
const PERIOD_EVENT = 'qualio:period-changed'
export type Period = 7 | 30 | 90

function readStorage(key: string) {
  try { return window.localStorage.getItem(key) } catch { return null }
}

/**
 * Identifiant du projet choisi, lu directement dans le navigateur : l'accueil peut
 * ainsi lancer son appel sans attendre la liste des projets.
 */
export function useStoredSiteId() {
  const [siteId, setSiteId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    const read = () => setSiteId(readStorage(PROJECT_KEY))
    read()
    setHydrated(true)
    const onChange = (event: Event) => setSiteId((event as CustomEvent<{ siteId?: string }>).detail?.siteId || readStorage(PROJECT_KEY))
    window.addEventListener('qualio:project-changed', onChange)
    window.addEventListener('storage', read)
    return () => { window.removeEventListener('qualio:project-changed', onChange); window.removeEventListener('storage', read) }
  }, [])
  return { siteId, hydrated }
}

/** Période d'analyse (7 / 30 / 90 jours), mémorisée et partagée entre Accueil et Thèmes. */
export function usePeriod(): [Period, (days: Period) => void] {
  const [days, setDaysState] = useState<Period>(30)
  useEffect(() => {
    const read = () => { const value = Number(readStorage(PERIOD_KEY)); if (value === 7 || value === 30 || value === 90) setDaysState(value) }
    read()
    window.addEventListener(PERIOD_EVENT, read)
    return () => window.removeEventListener(PERIOD_EVENT, read)
  }, [])
  const setDays = useCallback((value: Period) => {
    setDaysState(value)
    try { window.localStorage.setItem(PERIOD_KEY, String(value)) } catch {}
    window.dispatchEvent(new Event(PERIOD_EVENT))
  }, [])
  return [days, setDays]
}
