'use client'
import { useEffect, useState } from 'react'
import { useSites } from './useSites'

const STORAGE_KEY = 'qualio:selected-site'

/** Projet actif partagé avec la sidebar (localStorage + événement qualio:project-changed). */
export function useActiveSite() {
  const query = useSites()
  const sites = query.data
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const read = () => { try { setSelectedId(window.localStorage.getItem(STORAGE_KEY)) } catch { setSelectedId(null) } }
    read()
    const onChange = (event: Event) => {
      const id = (event as CustomEvent<{ siteId?: string }>).detail?.siteId
      if (id) setSelectedId(id); else read()
    }
    window.addEventListener('qualio:project-changed', onChange)
    window.addEventListener('storage', read)
    return () => { window.removeEventListener('qualio:project-changed', onChange); window.removeEventListener('storage', read) }
  }, [])

  const activeSite = sites?.find((site) => site.id === selectedId) ?? sites?.[0]
  return { ...query, sites, activeSite }
}
