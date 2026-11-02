'use client'

import { useEffect } from 'react'

/** Marque ce navigateur comme « admin » : ses visites sur le site public ne sont plus comptées dans les statistiques. */
export function AdminTrackingExclusion() {
  useEffect(() => {
    const host = window.location.hostname
    const domain = host.endsWith('tryqualio.pro') ? '; domain=.tryqualio.pro' : ''
    document.cookie = `qualio_ignore=1; path=/; max-age=31536000; SameSite=Lax${domain}${window.location.protocol === 'https:' ? '; Secure' : ''}`
  }, [])
  return null
}
