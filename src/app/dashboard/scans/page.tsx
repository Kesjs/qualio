'use client'

import { useState } from 'react'
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

const allScans = [
  {
    id: '#878909',
    site: 'app.qualio.dev',
    trigger: 'Automatique (CI/CD)',
    date: '2 Déc 2026, 14:32',
    status: 'Succès',
    checksPassed: 18,
    checksFailed: 0,
    duration: '38s',
  },
  {
    id: '#878908',
    site: 'docs.qualio.dev',
    trigger: 'Manuel',
    date: '1 Déc 2026, 09:15',
    status: 'Succès',
    checksPassed: 42,
    checksFailed: 0,
    duration: '54s',
  },
  {
    id: '#878907',
    site: 'acme-store.com',
    trigger: 'Automatique (Quotidien)',
    date: '30 Nov 2026, 03:00',
    status: 'Échec',
    checksPassed: 9,
    checksFailed: 3,
    duration: '46s',
  },
]

export default function ScansPage() {
  const [search, setSearch] = useState('')

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
              {allScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-5 font-mono font-medium text-gray-900 dark:text-white">
                    {scan.id}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-gray-900 dark:text-white">
                    {scan.site}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400">{scan.trigger}</td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400">{scan.date}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{scan.checksPassed} passés</span>
                    {scan.checksFailed > 0 && (
                      <span className="text-rose-500 dark:text-rose-400 font-medium ml-1.5">· {scan.checksFailed} échecs</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        scan.status === 'Succès'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                          : 'bg-red-50 text-red-600 border border-red-200/50 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                      }`}
                    >
                      {scan.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-500 dark:text-zinc-400">{scan.duration}</td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#ee6018] hover:text-[#d95514] dark:text-[#ff7836] dark:hover:text-[#ee6018]"
                    >
                      <span>Détails</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
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

