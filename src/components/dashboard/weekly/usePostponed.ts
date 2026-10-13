'use client'

import { useCallback, useEffect, useState } from 'react'

const storageKey = (siteId: string) => `qualio:postponed:${siteId}`

/** « Plus tard » : interface seulement (doc 3.8), la recommandation descend dans « Autres recommandations ». Conservé dans ce navigateur. */
export function usePostponed(siteId?: string) {
  const [postponedIds, setIds] = useState<string[]>([])

  useEffect(() => {
    if (!siteId) { setIds([]); return }
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey(siteId)) ?? '[]')
      setIds(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [])
    } catch { setIds([]) }
  }, [siteId])

  const postpone = useCallback((id: string) => {
    setIds((current) => {
      const next = [...current.filter((value) => value !== id), id].slice(-50)
      try { if (siteId) window.localStorage.setItem(storageKey(siteId), JSON.stringify(next)) } catch { /* stockage indisponible */ }
      return next
    })
  }, [siteId])

  return { postponedIds, postpone }
}
