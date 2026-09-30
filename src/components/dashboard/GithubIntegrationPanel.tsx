'use client'

import { useEffect, useState } from 'react'
import { ArrowTopRightOnSquareIcon, CheckCircleIcon, CodeBracketIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useSites } from '@/lib/hooks/useSites'

type Repository = { id: number; name: string; full_name: string; default_branch: string; private: boolean }

export function GithubIntegrationPanel() {
  const { data: sites } = useSites()
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [installationId, setInstallationId] = useState<number | null>(null)
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedRepo, setSelectedRepo] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadRepositories = async () => {
    const response = await fetch('/api/integrations/github/repositories')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'GitHub est indisponible')
    setConnected(Boolean(data.connected))
    setAccount(data.account || '')
    setInstallationId(data.installationId || null)
    setRepositories(data.repositories || [])
  }

  useEffect(() => {
    loadRepositories().catch((reason) => setError(reason instanceof Error ? reason.message : 'GitHub est indisponible'))
  }, [])

  const selected = repositories.find((repo) => repo.full_name === selectedRepo)
  const linkRepository = async () => {
    if (!selectedSite || !selected) return
    setMessage(''); setError('')
    const [owner, repo] = selected.full_name.split('/')
    const response = await fetch(`/api/sites/${selectedSite}/github-repository`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner, repo, defaultBranch: selected.default_branch, installationId }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error || 'Le dépôt n’a pas pu être associé.'); return }
    setMessage(`Dépôt ${selected.full_name} associé au site.`)
  }

  return (
    <div className="space-y-7 p-5 md:p-7">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">GitHub</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Connectez un dépôt en permissions minimales pour préparer des pull requests brouillon à partir des incidents Qualio.</p>
      </div>
      <div className="rounded-xl border border-gray-200/80 bg-gray-50/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.015]">
        <div className="flex items-start gap-3">
          <CodeBracketIcon className="mt-0.5 h-5 w-5 text-[#ee6018]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{connected ? `GitHub connecté${account ? ` · ${account}` : ''}` : 'GitHub non connecté'}</p>
            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-zinc-400">Qualio lit les dépôts autorisés et crée uniquement des branches/PR brouillon lorsque vous le demandez.</p>
          </div>
          {!connected ? <a href="/api/integrations/github/install" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#ee6018] px-3 py-2 text-xs font-semibold text-white">Connecter GitHub <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" /></a> : null}
        </div>
      </div>
      {connected ? <div className="grid max-w-xl gap-4 md:grid-cols-2">
        <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Site Qualio<select value={selectedSite} onChange={(event) => setSelectedSite(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/[0.08] dark:bg-[#111216] dark:text-white"><option value="">Choisir un site</option>{sites?.map((site) => <option key={site.id} value={site.id}>{site.name || site.url}</option>)}</select></label>
        <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Dépôt GitHub<select value={selectedRepo} onChange={(event) => setSelectedRepo(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/[0.08] dark:bg-[#111216] dark:text-white"><option value="">Choisir un dépôt</option>{repositories.map((repo) => <option key={repo.id} value={repo.full_name}>{repo.full_name}{repo.private ? ' · privé' : ''}</option>)}</select></label>
        <button type="button" onClick={linkRepository} disabled={!selectedSite || !selectedRepo || !installationId} className="rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2">Associer le dépôt au site</button>
      </div> : null}
      {message ? <p className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="h-4 w-4" />{message}</p> : null}
      {error ? <p className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400"><ExclamationCircleIcon className="h-4 w-4" />{error}</p> : null}
    </div>
  )
}
