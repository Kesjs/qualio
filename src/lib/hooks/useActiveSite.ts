'use client'
import { useEffect, useState } from 'react'
import { useSites } from './useSites'

const STORAGE_KEY = 'qualio:selected-site'

export function chooseActiveSite<T extends { id: string }>(sites: T[] | undefined, selectedId: string | null) {
  return sites?.find((site) => site.id === selectedId) ?? sites?.[0]
}

export function selectedIdFromProjectEvent(event: Event, readStored: () => string | null) {
  const id = (event as CustomEvent<{ siteId?: string }>).detail?.siteId
  return id || readStored()
}

/** Projet actif partagé avec la sidebar (localStorage + événement qualio:project-changed). */
export function useActiveSite() {
  const query = useSites()
  const sites = query.data
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const read = () => { try { setSelectedId(window.localStorage.getItem(STORAGE_KEY)) } catch { setSelectedId(null) } }
    read()
    const onChange = (event: Event) => setSelectedId(selectedIdFromProjectEvent(event, () => { try { return window.localStorage.getItem(STORAGE_KEY) } catch { return null } }))
    window.addEventListener('qualio:project-changed', onChange)
    window.addEventListener('storage', read)
    return () => { window.removeEventListener('qualio:project-changed', onChange); window.removeEventListener('storage', read) }
  }, [])

  const activeSite = chooseActiveSite(sites, selectedId)
  return { ...query, sites, activeSite }
}
