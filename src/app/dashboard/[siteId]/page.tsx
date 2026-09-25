'use client'
import { useState, use } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Globe, Play, ExternalLink, ShieldAlert, CheckCircle2, Clock, Activity, LayoutTemplate, Bug } from 'lucide-react'
import { useSite } from '@/lib/hooks/useSite'
import { useScanResults } from '@/lib/hooks/useScan'
import { NewQAModal } from '@/components/qa/NewQAModal'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function SiteDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params)
  const { data: site, isLoading, error } = useSite(siteId)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'pages'>('overview')

  const latestScan = site?.scans?.[0]
  const { data: results, isLoading: resultsLoading } = useScanResults(latestScan?.id || null, latestScan?.status)

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-carbon rounded-lg" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-carbon rounded" />
            <div className="h-4 w-64 bg-carbon/50 rounded" />
          </div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="flex gap-6 border-b border-border pb-px">
          <div className="h-6 w-24 bg-carbon rounded mb-2" />
          <div className="h-6 w-24 bg-carbon/50 rounded mb-2" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-carbon/40 rounded-xl border border-border" />
          ))}
        </div>
        
        {/* Main Content Area Skeleton */}
        <div className="h-[400px] bg-carbon/20 rounded-xl border border-border" />
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
        Site introuvable ou erreur de chargement.
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour aux sites
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-ash/30 flex items-center justify-center shrink-0 border border-border">
              <Globe className="w-6 h-6 text-ink-secondary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-semibold text-white tracking-tight flex items-center gap-3">
                {site.name || new URL(site.url).hostname}
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-orange transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </h1>
              <p className="text-ink-secondary mt-1">{site.url}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange text-white rounded-lg hover:bg-[#d95514] transition-colors font-medium shadow-lg shadow-orange/20"
        >
          <Play className="w-4 h-4 fill-current" />
          Nouveau Scan
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex items-center gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'overview' ? 'border-orange text-white' : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-border'}`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'issues' ? 'border-orange text-white' : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-border'}`}
          >
            Bugs & Problèmes
            {latestScan?.checks_failed ? (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400">
                {latestScan.checks_failed}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'pages' ? 'border-orange text-white' : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-border'}`}
          >
            Pages crawlées
            {latestScan?.pages_discovered ? (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-ash text-ink-primary">
                {latestScan.pages_discovered}
              </span>
            ) : null}
          </button>
        </nav>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {!latestScan ? (
              <div className="p-12 text-center bg-carbon border border-border rounded-xl">
                <LayoutTemplate className="w-12 h-12 text-ink-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucun scan n'a été effectué</h3>
                <p className="text-ink-secondary mb-6">Lancez un scan pour analyser ce site.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-5 bg-carbon border border-border rounded-xl">
                    <p className="text-sm font-medium text-ink-muted mb-1 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-400" /> Bugs critiques</p>
                    <p className="text-3xl font-semibold text-white">{latestScan.critical_count}</p>
                  </div>
                  <div className="p-5 bg-carbon border border-border rounded-xl">
                    <p className="text-sm font-medium text-ink-muted mb-1 flex items-center gap-2"><Bug className="w-4 h-4 text-orange" /> Avertissements majeurs</p>
                    <p className="text-3xl font-semibold text-white">{latestScan.major_count}</p>
                  </div>
                  <div className="p-5 bg-carbon border border-border rounded-xl">
                    <p className="text-sm font-medium text-ink-muted mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Tests réussis</p>
                    <p className="text-3xl font-semibold text-white">{latestScan.checks_passed} <span className="text-sm text-ink-muted font-normal">/ {latestScan.checks_total}</span></p>
                  </div>
                  <div className="p-5 bg-carbon border border-border rounded-xl">
                    <p className="text-sm font-medium text-ink-muted mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Dernier scan</p>
                    <p className="text-lg font-medium text-white">{formatDistanceToNow(new Date(latestScan.created_at!), { addSuffix: true, locale: fr })}</p>
                    <p className="text-xs text-ink-muted mt-1 capitalize">{latestScan.status}</p>
                  </div>
                </div>

                <div className="p-6 bg-carbon border border-border rounded-xl">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-orange" /> Résumé de l'IA</h3>
                  <p className="text-ink-secondary leading-relaxed">{latestScan.summary || 'Résumé en cours de génération...'}</p>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'issues' && (
          <motion.div key="issues" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {resultsLoading ? (
              <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : results?.issues?.length === 0 ? (
              <div className="p-12 text-center bg-carbon border border-border rounded-xl">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white">Aucun problème détecté</h3>
                <p className="text-ink-secondary mt-1">Excellent travail ! Le site semble parfait.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results?.issues.map((issue) => (
                  <div key={issue.id} className="p-5 bg-carbon border border-border hover:border-border/80 transition-colors rounded-xl flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      {issue.severity === 'critical' ? (
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                      ) : (
                        <Bug className="w-5 h-5 text-orange" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${issue.severity === 'critical' ? 'bg-red-400/10 text-red-400' : 'bg-orange/10 text-orange'}`}>
                          {issue.severity}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ash text-ink-muted">
                          {issue.category}
                        </span>
                      </div>
                      <h4 className="text-base font-medium text-white mb-2">{issue.title}</h4>
                      <p className="text-sm text-ink-secondary mb-3">{issue.description}</p>
                      {issue.suggestion && (
                        <div className="p-3 bg-ash/30 rounded-lg text-sm text-ink-primary border border-border/50">
                          <span className="font-medium text-green-400 mr-2">Solution:</span>
                          {issue.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'pages' && (
          <motion.div key="pages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {resultsLoading ? (
              <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <div className="bg-carbon border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-ash/30 text-ink-muted text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">URL</th>
                      <th className="px-6 py-4 w-32">Statut</th>
                      <th className="px-6 py-4 w-32 hidden md:table-cell">Temps (ms)</th>
                      <th className="px-6 py-4 w-24 text-center">Niveau</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {results?.pages.map((page) => (
                      <tr key={page.id} className="hover:bg-ash/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-white truncate max-w-xs md:max-w-md">
                          {page.url}
                          {page.title && <p className="text-xs text-ink-muted truncate font-normal mt-1">{page.title}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            page.status_code && page.status_code < 400 ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                          }`}>
                            HTTP {page.status_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-ink-secondary hidden md:table-cell">{page.response_time_ms}</td>
                        <td className="px-6 py-4 text-center text-ink-muted">{page.depth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <NewQAModal 
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)} 
        siteId={site.id}
        siteUrl={site.url}
        onSuccess={() => setActiveTab('overview')}
      />
    </div>
  )
}
