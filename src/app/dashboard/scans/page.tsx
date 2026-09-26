'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'

export default function ScansPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['all-scans'],
    queryFn: async () => {
      const res = await fetch('/api/scans')
      if (!res.ok) throw new Error('Failed to fetch scans')
      return res.json()
    }
  })

  // Filter based on search
  const filteredScans = scans.filter((scan: any) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      scan.id.toLowerCase().includes(searchLower) ||
      (scan.sites?.url || '').toLowerCase().includes(searchLower) ||
      (scan.sites?.name || '').toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDuration = (startedStr: string, completedStr: string) => {
    if (!startedStr || !completedStr) return '-'
    const s = new Date(startedStr).getTime()
    const c = new Date(completedStr).getTime()
    return Math.round((c - s) / 1000) + 's'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
            Scans
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Journal complet des sessions de navigation et exécutions Playwright.
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden dark:bg-[#16181E] dark:border-white/[0.08]">
        <div className="p-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par ID ou nom de domaine..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-500 transition-all"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#111216] dark:text-zinc-300 dark:hover:bg-white/[0.04] transition-colors"
          >
            <Filter className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
            <span>Filtrer</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/60 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px] dark:bg-[#111216]/60 dark:border-white/[0.06] dark:text-zinc-500">
              <tr>
                <th className="py-3 px-5">ID Scan</th>
                <th className="py-3 px-4">Site Web</th>
                <th className="py-3 px-4">Déclencheur</th>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Résultats</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Durée</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80 dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-[#ee6018] animate-spin dark:border-zinc-700 dark:border-t-[#ff7836]"></div>
                      <span className="text-xs text-gray-500 dark:text-zinc-400">Chargement de l'historique...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4">
                    <EmptyState
                      title="Aucun scan trouvé"
                      message="L'historique est vide ou aucun scan ne correspond à votre recherche. Lancez un diagnostic depuis l'onglet Sites pour voir les résultats ici."
                      actionLabel="Aller aux Sites"
                      actionIcon={ArrowUpRight}
                      onActionClick={() => router.push('/dashboard/sites')}
                      mainIcon={History}
                      className="max-w-xl mx-auto border-0 bg-transparent shadow-none p-6 sm:p-8"
                    />
                  </td>
                </tr>
              ) : filteredScans.map((scan: any) => (
                <tr key={scan.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-5 font-mono font-medium text-gray-900 dark:text-white" title={scan.id}>
                    {scan.id.slice(0, 8)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-gray-900 dark:text-white">
                    <Link href={`/dashboard/sites/${scan.site_id}`} className="hover:underline">
                      {scan.sites?.url?.replace(/^https?:\/\//, '') || scan.sites?.name}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400">Manuel</td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400">{formatDate(scan.created_at)}</td>
                  <td className="py-3.5 px-4">
                    {scan.checks_passed !== null && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{scan.checks_passed} passés</span>}
                    {scan.checks_failed > 0 && (
                      <span className="text-rose-500 dark:text-rose-400 font-medium ml-1.5">· {scan.checks_failed} échecs</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        scan.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                          : scan.status === 'failed' || scan.status === 'error'
                          ? 'bg-red-50 text-red-600 border border-red-200/50 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                          : 'bg-blue-50 text-blue-600 border border-blue-200/50 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25'
                      }`}
                    >
                      {scan.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-500 dark:text-zinc-400">{getDuration(scan.started_at, scan.completed_at)}</td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href={`/dashboard/sites/${scan.site_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#ee6018] hover:text-[#d95514] dark:text-[#ff7836] dark:hover:text-[#ee6018]"
                    >
                      <span>Détails</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
