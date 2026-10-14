'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { useSites } from '@/lib/hooks/useSites'
import { useOverview } from '@/lib/hooks/useDashboard'
import { Select } from '@/components/dashboard/Select'

type Billing = { plan: 'free' | 'pro'; label: string; limits: { projects: number }; usage: { projects: number } }

export function WorkspaceToolbar() {
  const { activeSite } = useActiveSite()
  const { data: sites = [] } = useSites()
  const overview = useOverview()
  const billing = useQuery({ queryKey: ['billing-status'], queryFn: async (): Promise<Billing> => { const response = await fetch('/api/billing/status'); if (!response.ok) throw new Error('Usage indisponible'); return response.json() }, staleTime: 30_000 })
  const usage = overview.data && overview.data.state !== 'no_project' ? overview.data.counts : undefined
  const limitReached = billing.data && billing.data.usage.projects >= billing.data.limits.projects
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3 md:px-8">
    <div className="flex min-w-0 items-center gap-2"><Select label="Projet actif" value={activeSite?.id ?? ''} onChange={(siteId) => { window.localStorage.setItem('qualio:selected-site', siteId); window.dispatchEvent(new CustomEvent('qualio:project-changed', { detail: { siteId } })) }} options={sites.length ? sites.map((site) => ({ value: site.id, label: site.name || site.url || 'Projet sans nom' })) : [{ value: '', label: 'Aucun projet', disabled: true }]} placeholder="Choisir un projet" className="min-w-0 max-w-48" buttonClassName="min-h-10 border-border-strong bg-surface text-ink-primary" />{limitReached ? <button type="button" disabled title="La limite de projets de votre plan est atteinte." className="launch-secondary !px-2"><LockClosedIcon className="h-4 w-4" /><span className="hidden lg:inline">Nouveau projet</span></button> : <Link href="/onboarding" className="launch-secondary !px-2">Nouveau projet</Link>}</div>
    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-secondary">{billing.data ? <span className="rounded-md border border-border-strong px-2 py-1 font-semibold text-ink-primary">{billing.data.label}</span> : <span>{billing.isError ? 'Plan indisponible' : 'Chargement du plan…'}</span>}{usage && <span className="font-mono">{usage.total} avis conservés</span>}{billing.data?.plan === 'free' && <Link href="/pricing" className="launch-secondary !min-h-9 !px-3 !text-xs">Passer à Pro</Link>}</div>
  </div>
}
