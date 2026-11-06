'use client'

import { useMemo, useState } from 'react'
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  DocumentChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/20/solid'
import { BTN_SMALL_ACCENT, type Notify, type ReportTarget } from '@/components/admin/acquisition-shared'
import type { PipelineData } from '@/lib/admin/acquisition'

type CampaignCategory = 'all' | 'saas' | 'agency' | 'ecommerce'

interface TargetSpec {
  name: string
  domain: string
  category: 'saas' | 'agency' | 'ecommerce'
  categoryLabel: string
  contactName: string
  contactRole: string
  rating: string
  reviewsCount: string
  topProblem: string
  appStoreId?: string
}

export const CAMPAIGN_TARGETS: TargetSpec[] = [
  {
    name: 'ScanTicket',
    domain: 'scanticket.io',
    category: 'saas',
    categoryLabel: 'SaaS B2B',
    contactName: 'Julien Meyer',
    contactRole: 'Fondateur',
    rating: '4.3',
    reviewsCount: '346 avis',
    topProblem: 'Détection TVA & photos floues',
    appStoreId: '454155575',
  },
  {
    name: 'Qlower',
    domain: 'qlower.com',
    category: 'saas',
    categoryLabel: 'SaaS B2B',
    contactName: 'Christophe Dufour',
    contactRole: 'Co-fondateur & CEO',
    rating: '4.3',
    reviewsCount: '41 avis',
    topProblem: 'Synchro bancaire & bugs transactions',
    appStoreId: '1544489613',
  },
  {
    name: 'Mes notes de frais',
    domain: 'mes-notes-de-frais.com',
    category: 'saas',
    categoryLabel: 'SaaS B2B',
    contactName: 'Félix Le Dref',
    contactRole: 'Fondateur',
    rating: '4.3',
    reviewsCount: '99 avis',
    topProblem: 'Export mail cassé depuis mise à jour',
    appStoreId: '1198308993',
  },
  {
    name: 'ATTIX',
    domain: 'attix.io',
    category: 'saas',
    categoryLabel: 'SaaS B2B',
    contactName: 'Direction Attix',
    contactRole: 'Fondateur',
    rating: '4.4',
    reviewsCount: '39 avis',
    topProblem: 'Rigueur devis face à Obat',
    appStoreId: '6748462097',
  },
  {
    name: 'Easy Quittance',
    domain: 'easy-quittance.fr',
    category: 'saas',
    categoryLabel: 'SaaS B2B',
    contactName: 'Kotokan Yapo',
    contactRole: 'Fondateur',
    rating: '3.9',
    reviewsCount: '40 avis',
    topProblem: 'Oubli mails locataires & baux',
    appStoreId: '1667273455',
  },
  {
    name: 'Digidop',
    domain: 'digidop.fr',
    category: 'agency',
    categoryLabel: 'Agence Web',
    contactName: 'Florian Verdonck',
    contactRole: 'Co-fondateur',
    rating: '4.9',
    reviewsCount: '80+ avis',
    topProblem: 'Livrable audit UX avant-vente client',
  },
  {
    name: 'Ouiflow',
    domain: 'ouiflow.io',
    category: 'agency',
    categoryLabel: 'Studio Web',
    contactName: 'Lucas Marchand',
    contactRole: 'Fondateur',
    rating: '5.0',
    reviewsCount: 'Projets clients',
    topProblem: 'Cadrage UX avant refonte client',
  },
  {
    name: 'Studio HB',
    domain: 'studio-hb.com',
    category: 'agency',
    categoryLabel: 'Agence Web',
    contactName: 'Direction Studio HB',
    contactRole: 'Dirigeant',
    rating: '4.8',
    reviewsCount: 'Partenaires',
    topProblem: 'Audit des frictions clients finaux',
  },
  {
    name: 'Miyette',
    domain: 'miyette-paris.com',
    category: 'ecommerce',
    categoryLabel: 'E-commerce D2C',
    contactName: 'Roxane Tardy',
    contactRole: 'Co-fondatrice',
    rating: '4.0',
    reviewsCount: '~30 avis',
    topProblem: 'Dimensions sacs mal estimées & SAV',
  },
  {
    name: 'Flotte',
    domain: 'flotte.fr',
    category: 'ecommerce',
    categoryLabel: 'E-commerce D2C',
    contactName: 'Lyly Pan',
    contactRole: 'Co-fondatrice',
    rating: '4.0',
    reviewsCount: '~250 avis',
    topProblem: 'Durabilité des fermetures éclair',
  },
]

export function AcquisitionCampaignTracker({
  data,
  onCreateReport,
  notify,
}: {
  data: PipelineData
  onCreateReport: (target: ReportTarget) => void
  notify: Notify
}) {
  const [filter, setFilter] = useState<CampaignCategory>('all')

  const targetRows = useMemo(() => {
    return CAMPAIGN_TARGETS.map((spec) => {
      const queueItem = data.queue.find(
        (q) => q.domain.toLowerCase() === spec.domain.toLowerCase() || q.name.toLowerCase() === spec.name.toLowerCase()
      )
      const draft = data.drafts.find(
        (d) =>
          d.company.toLowerCase().includes(spec.name.toLowerCase()) ||
          d.email.toLowerCase().includes(spec.domain.toLowerCase())
      )
      const tracking = data.tracking.find(
        (t) =>
          t.company.toLowerCase().includes(spec.name.toLowerCase()) ||
          t.email.toLowerCase().includes(spec.domain.toLowerCase())
      )

      const report = queueItem?.report ?? draft?.report ?? tracking?.report ?? null

      return {
        spec,
        queueItem,
        draft,
        tracking,
        report,
      }
    })
  }, [data])

  const filteredRows = useMemo(() => {
    if (filter === 'all') return targetRows
    return targetRows.filter((row) => row.spec.category === filter)
  }, [targetRows, filter])

  // Métriques d'avancement
  const reportsCount = targetRows.filter((r) => r.report !== null).length
  const draftsCount = targetRows.filter((r) => r.draft !== null).length
  const sentCount = targetRows.filter((r) => r.tracking?.sentAt !== undefined && r.tracking?.sentAt !== null).length
  const viewedCount = targetRows.filter(
    (r) => r.tracking?.clickedAt !== null || (r.report && r.report.viewCount > 0)
  ).length
  const repliedCount = targetRows.filter((r) => r.tracking?.repliedAt !== null).length

  return (
    <section
      aria-label="Campagne Semaine 1"
      className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-white/[0.08] dark:bg-[#16181E] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
    >
      {/* En-tête de la campagne */}
      <div className="border-b border-gray-200/80 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent p-5 dark:border-white/[0.06] sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ee6018]/10 text-[#ee6018] dark:bg-[#ee6018]/20">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#ee6018]">
              Campagne Semaine 1
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            Objectif : Décrocher les 10 premiers utilisateurs
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
            5 SaaS B2B · 3 Agences Web · 2 E-commerces D2C. Chaque cible reçoit un rapport offert sur ses avis avant le pitch.
          </p>
        </div>

        {/* Règles d'envoi & compteurs */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-0">
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Rapports prêts
            </p>
            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
              {reportsCount} <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">/ 10</span>
            </p>
          </div>
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Brouillons
            </p>
            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
              {draftsCount} <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">/ 10</span>
            </p>
          </div>
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Envoyés (max 10)
            </p>
            <p className="font-mono text-sm font-bold text-[#ee6018]">
              {sentCount} <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">/ 10</span>
            </p>
          </div>
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Vus / Ouverts
            </p>
            <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {viewedCount}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Réponses
            </p>
            <p className="font-mono text-sm font-bold text-[#c2410c] dark:text-[#ff9a66]">
              {repliedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Barre de filtres par profil */}
      <div className="flex items-center gap-1.5 border-b border-gray-200/80 px-5 py-2.5 dark:border-white/[0.06]">
        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Segment :</span>
        {(
          [
            { id: 'all', label: 'Toutes (10)' },
            { id: 'saas', label: 'SaaS B2B (5)' },
            { id: 'agency', label: 'Agences Web (3)' },
            { id: 'ecommerce', label: 'E-commerce D2C (2)' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === tab.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table des 10 cibles */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200/80 bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-white/[0.06] dark:bg-[#111216] dark:text-zinc-400">
              <th scope="col" className="px-5 py-3">Entreprise & Décideur</th>
              <th scope="col" className="px-4 py-3">Segment</th>
              <th scope="col" className="px-4 py-3">Avis & Note</th>
              <th scope="col" className="px-4 py-3">Problème n°1 extrait</th>
              <th scope="col" className="px-4 py-3">Rapport Qualio</th>
              <th scope="col" className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60 dark:divide-white/[0.04]">
            {filteredRows.map(({ spec, queueItem, draft, report }) => (
              <tr key={spec.domain} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {spec.name}{' '}
                    <span className="font-normal text-gray-400 dark:text-zinc-500">
                      ({spec.domain})
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500 dark:text-zinc-400">
                    {spec.contactName} · <span className="italic">{spec.contactRole}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      spec.category === 'saas'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : spec.category === 'agency'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    {spec.categoryLabel}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">
                    {spec.rating} ★
                  </span>{' '}
                  <span className="text-gray-400 dark:text-zinc-500">· {spec.reviewsCount}</span>
                </td>
                <td className="px-4 py-3.5 max-w-xs">
                  <span className="line-clamp-1 text-gray-700 dark:text-zinc-300 font-medium" title={spec.topProblem}>
                    {spec.topProblem}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {report ? (
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-[#ee6018] hover:underline"
                    >
                      <DocumentChartBarIcon className="h-4 w-4" />
                      <span>Rapport prêt</span>
                      {report.viewCount > 0 && (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {report.viewCount} vue{report.viewCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <ArrowTopRightOnSquareIcon className="h-3 w-3 text-gray-400" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onCreateReport({
                          companyId: queueItem?.id ?? null,
                          companyName: spec.name,
                          appStoreUrl: spec.appStoreId ? `https://apps.apple.com/fr/app/id${spec.appStoreId}` : undefined,
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                    >
                      <SparklesIcon className="h-3.5 w-3.5 text-[#ee6018]" />
                      Générer le rapport
                    </button>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  {draft ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircleIcon className="h-4 w-4" />
                      Brouillon prêt
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onCreateReport({
                          companyId: queueItem?.id ?? null,
                          companyName: spec.name,
                          appStoreUrl: spec.appStoreId ? `https://apps.apple.com/fr/app/id${spec.appStoreId}` : undefined,
                        })
                      }
                      className={BTN_SMALL_ACCENT}
                    >
                      Préparer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
