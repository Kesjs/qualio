'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowTopRightOnSquareIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { useProjectAccess } from '@/components/dashboard/useProjectAccess'
import { Banner, surface } from '@/components/dashboard/weekly/bricks'
import { PROJECT_SECTORS } from '@/lib/projects/sectors'
import { dangerButton, EmptyState, focusRing, inputClass, PageHeader, primaryButton, secondaryButton, selectClass, Skeleton, Tabs, UsageMeter } from '@/components/dashboard/ui'
import { Select } from '@/components/dashboard/Select'

type TabId = 'project' | 'notifications' | 'billing' | 'account'
const TABS = [
  { id: 'project' as const, label: 'Projet' },
  { id: 'notifications' as const, label: 'Notifications' },
  { id: 'billing' as const, label: 'Abonnement et usage' },
  { id: 'account' as const, label: 'Compte' },
]
type Flash = { tone: 'ok' | 'error'; text: string } | null

const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'Europe/Paris' }).format(new Date(value)) : null

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('project')
  const [flash, setFlash] = useState<Flash>(null)

  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => setFlash(null), 4000)
    return () => window.clearTimeout(timer)
  }, [flash])

  return (
    <div className="space-y-6 pb-16">
      <PageHeader eyebrow="Réglages" title="Votre espace, simplement" description="Projet, notifications, abonnement et compte." />
      <Tabs label="Sections des réglages" tabs={TABS} value={tab} onChange={setTab} />

      {flash && (
        <p role={flash.tone === 'error' ? 'alert' : 'status'} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm motion-safe:animate-[qualio-fade_200ms_ease-out] ${flash.tone === 'error' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100'}`}>
          {flash.tone === 'ok' && <CheckCircleIcon className="h-4 w-4 shrink-0" aria-hidden />}{flash.text}
        </p>
      )}

      <div role="tabpanel" aria-label={TABS.find((item) => item.id === tab)?.label} className="motion-safe:animate-[qualio-fade_200ms_ease-out]">
        {tab === 'project' && <ProjectSection onFlash={setFlash} />}
        {tab === 'notifications' && <NotificationsSection onFlash={setFlash} />}
        {tab === 'billing' && <BillingSection onFlash={setFlash} />}
        {tab === 'account' && <AccountSection onFlash={setFlash} />}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Projet */

function ProjectSection({ onFlash }: { onFlash: (flash: Flash) => void }) {
  const router = useRouter()
  const { activeSite, isLoading, refetch } = useActiveSite()
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const displayName = activeSite?.name || activeSite?.url || ''

  useEffect(() => { setName(activeSite?.name ?? ''); setSector(activeSite?.sector ?? '') }, [activeSite?.id, activeSite?.name, activeSite?.sector])

  if (isLoading) return <Skeleton className="h-64" />
  if (!activeSite) return <EmptyState title="Aucun projet" body="Créez un projet pour configurer son nom et ses sources d’avis." href="/onboarding" label="Créer un projet" />

  async function saveName() {
    if (!activeSite) return
    const trimmed = name.trim()
    if (!trimmed) return onFlash({ tone: 'error', text: 'Donnez un nom à votre projet.' })
    setBusy(true)
    const response = await fetch(`/api/sites/${activeSite.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: trimmed, sector: sector || null }) })
    setBusy(false)
    if (!response.ok) return onFlash({ tone: 'error', text: (await response.json().catch(() => ({}))).error ?? 'Impossible d’enregistrer le nom.' })
    await refetch()
    onFlash({ tone: 'ok', text: 'Projet enregistré.' })
  }

  async function deleteProject() {
    if (!activeSite || confirmText !== displayName) return
    setBusy(true)
    const response = await fetch(`/api/sites/${activeSite.id}`, { method: 'DELETE' })
    setBusy(false)
    if (!response.ok) return onFlash({ tone: 'error', text: 'Le projet n’a pas pu être supprimé.' })
    try { window.localStorage.removeItem('qualio:selected-site') } catch { /* stockage indisponible */ }
    window.dispatchEvent(new CustomEvent('qualio:project-changed', { detail: {} }))
    setConfirmText('')
    await refetch()
    window.dispatchEvent(new Event('app:refresh'))
    onFlash({ tone: 'ok', text: 'Projet supprimé avec ses avis.' })
    router.refresh()
  }

  return (
    <div className="grid gap-6">
      <section className={`${surface} max-w-2xl p-5 sm:p-6`} aria-labelledby="project-name">
        <h2 id="project-name" className="text-lg font-semibold text-gray-950 dark:text-white">Nom du projet</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Le nom apparaît dans le sélecteur de projet et dans vos emails.</p>
        <label className="mt-5 block text-sm font-semibold text-gray-800 dark:text-zinc-200">
          Nom
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} className={`${inputClass} mt-2`} />
        </label>
        <label className="mt-4 block text-sm font-semibold text-gray-800 dark:text-zinc-200">
          Secteur
          <Select label="Secteur" value={sector} onChange={setSector} className="mt-2" buttonClassName={`${selectClass} h-11 w-full text-base`} options={[{ value: '', label: 'Non précisé' }, ...PROJECT_SECTORS.map((item) => ({ value: item, label: item }))]} />
        </label>
        <label className="mt-4 block text-sm font-semibold text-gray-800 dark:text-zinc-200">
          Adresse du site <span className="font-normal text-gray-500 dark:text-zinc-400">(lecture seule)</span>
          <input value={activeSite.url ?? 'Aucune adresse'} readOnly className={`${inputClass} mt-2 cursor-default bg-gray-50 font-mono text-sm text-gray-600 dark:bg-white/[0.02] dark:text-zinc-400`} />
        </label>
        <button type="button" onClick={() => void saveName()} disabled={busy || (name.trim() === (activeSite.name ?? '') && sector === (activeSite.sector ?? ''))} className={`${primaryButton} mt-6`}>{busy ? 'Enregistrement…' : 'Enregistrer le projet'}</button>
      </section>

      <section className="max-w-2xl rounded-2xl border border-red-200 p-5 sm:p-6 dark:border-red-500/25" aria-labelledby="project-danger">
        <h2 id="project-danger" className="text-lg font-semibold text-red-700 dark:text-red-300">Supprimer ce projet</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-400">Tous les avis de ce projet, ses recommandations et ses synthèses sont supprimés définitivement. Pour confirmer, retapez le nom du projet : <strong className="text-gray-950 dark:text-white">{displayName}</strong></p>
        <label className="mt-4 block text-sm font-semibold text-gray-800 dark:text-zinc-200">
          Nom du projet
          <input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} aria-describedby="project-danger" placeholder={displayName} className={`${inputClass} mt-2`} />
        </label>
        <button type="button" onClick={() => void deleteProject()} disabled={busy || confirmText !== displayName} className={`${dangerButton} mt-4`}>Supprimer le projet</button>
      </section>
    </div>
  )
}

/* ------------------------------------------------------- Notifications */

function NotificationsSection({ onFlash }: { onFlash: (flash: Flash) => void }) {
  const access = useProjectAccess()
  const [loaded, setLoaded] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [consent, setConsent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/settings/notifications').then(async (response) => {
      if (!response.ok || cancelled) return
      const preferences = await response.json() as { weekly_digest: boolean; consent_source: string | null }
      setEnabled(preferences.weekly_digest); setConsent(preferences.consent_source)
    }).finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  async function save() {
    setBusy(true)
    const response = await fetch('/api/settings/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weeklyDigest: enabled }) })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) return onFlash({ tone: 'error', text: result.error ?? 'Impossible d’enregistrer cette préférence.' })
    setConsent(result.consent_source ?? consent)
    onFlash({ tone: 'ok', text: enabled ? 'Email du lundi activé.' : 'Email du lundi désactivé.' })
  }

  if (!loaded) return <Skeleton className="h-48" />

  return (
    <section className={`${surface} max-w-2xl p-5 sm:p-6`} aria-labelledby="digest-title">
      <h2 id="digest-title" className="text-lg font-semibold text-gray-950 dark:text-white">{access.isFree ? 'Emails de suivi' : 'Email du lundi et alertes'}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Vous gardez le contrôle : désinscription possible à tout moment.</p>
      <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition-colors duration-150 hover:border-gray-400 dark:border-white/10 dark:hover:border-white/30 ${focusRing}`}>
        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="mt-1 h-5 w-5 accent-gray-950 dark:accent-white" />
        <span>
          <strong className="block text-sm text-gray-950 dark:text-white">{access.isFree ? 'Être prévenu quand de nouveaux avis arrivent' : 'Recevoir le résumé hebdomadaire et les alertes'}</strong>
          <span className="mt-1 block text-sm leading-6 text-gray-500 dark:text-zinc-400">{access.isFree ? '2 emails par mois au maximum, seulement s’il y a de nouveaux avis et une synthèse disponible.' : 'Un email le lundi avec les évolutions de vos avis, et une alerte (une par semaine au plus) quand un thème négatif augmente.'}</span>
        </span>
      </label>
      {consent && <p className="mt-3 text-xs text-gray-500 dark:text-zinc-500">Dernier consentement enregistré depuis {consent === 'signup' ? 'l’inscription' : 'les réglages'}.</p>}
      <button type="button" onClick={() => void save()} disabled={busy} className={`${primaryButton} mt-6`}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
    </section>
  )
}

/* ---------------------------------------------------------- Abonnement */

function BillingSection({ onFlash }: { onFlash: (flash: Flash) => void }) {
  const access = useProjectAccess()
  const [busy, setBusy] = useState(false)
  const billing = access.billing

  if (access.isLoading || !billing) return <Skeleton className="h-64" />

  const isPaid = billing.plan !== 'free'
  const readOnlyCount = Math.max(0, billing.usage.projects - billing.writableSiteIds.length)
  const periodEnd = dateLabel(billing.currentPeriodEnd)

  async function openPortal() {
    setBusy(true)
    const response = await fetch('/api/billing/portal', { method: 'POST' })
    const result = await response.json().catch(() => ({}))
    if (!response.ok || !result.url) { setBusy(false); return onFlash({ tone: 'error', text: result.error ?? 'Le portail de facturation est indisponible.' }) }
    window.location.assign(result.url)
  }

  return (
    <div className="grid max-w-3xl gap-6">
      {readOnlyCount > 0 && <Banner tone="warn" action={<Link href="/pricing" className={primaryButton}>Voir les offres</Link>}>{readOnlyCount} projet{readOnlyCount > 1 ? 's sont' : ' est'} en lecture seule. Vos avis restent visibles et rien n’a été supprimé.</Banner>}

      <section className={`${surface} p-5 sm:p-6`} aria-labelledby="plan-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="plan-title" className="text-lg font-semibold text-gray-950 dark:text-white">Votre plan : {billing.label}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
              {isPaid
                ? `${billing.limits.projects} projets · ${billing.limits.feedbackPerProject.toLocaleString('fr-FR')} avis par projet · synthèse automatique chaque semaine${billing.interval ? ` · facturation ${billing.interval === 'year' ? 'annuelle' : 'mensuelle'}` : ''}`
                : '1 projet · 50 avis · 2 synthèses manuelles sur 30 jours. Vos avis et vos données restent conservés.'}
            </p>
          </div>
          <span className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${isPaid ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-zinc-200'}`}>{isPaid ? 'Actif' : 'Gratuit'}</span>
        </div>
        {periodEnd && <p className="mt-4 text-sm text-gray-600 dark:text-zinc-300">{billing.cancelAtPeriodEnd ? 'Fin de l’abonnement' : 'Prochaine échéance'} : <strong className="text-gray-950 dark:text-white">{periodEnd}</strong></p>}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <UsageMeter used={billing.usage.projects} limit={billing.limits.projects} label="projets" />
          {access.site && <UsageMeter used={access.site.feedback} limit={access.site.feedbackLimit} label="avis (projet actif)" />}
        </div>
      </section>

      <section className={`${surface} p-5 sm:p-6`} aria-labelledby="change-title">
        <h2 id="change-title" className="text-base font-semibold text-gray-950 dark:text-white">{isPaid ? 'Gérer votre abonnement' : 'Changer d’offre'}</h2>
        {!isPaid && (
          <>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">Pro (5 projets, 2 000 avis/projet) ou Agence (15 projets, 10 000 avis/projet, rapports partageables). Mensuel ou annuel (2 mois offerts).</p>
            <Link href="/pricing" className={`${primaryButton} mt-5`}>Voir les offres<ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden /></Link>
          </>
        )}
        {isPaid && billing.source === 'stripe' && (
          <>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">Changez de formule (mensuelle ou annuelle), mettez à jour votre moyen de paiement ou consultez vos factures sur le portail sécurisé.</p>
            <button type="button" onClick={() => void openPortal()} disabled={busy} className={`${secondaryButton} mt-5`}>{busy ? 'Ouverture…' : 'Gérer la facturation'}</button>
          </>
        )}
        {isPaid && (billing.provider === 'geniuspay' || billing.source === 'geniuspay') && (
          <>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">Votre abonnement est géré via GeniusPay (Mobile Money & Carte). Pour modifier votre formule ou renouveler votre accès, accédez aux tarifs.</p>
            <Link href="/pricing" className={`${primaryButton} mt-5`}>Changer ou renouveler mon offre<ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden /></Link>
          </>
        )}
        {isPaid && billing.source !== 'stripe' && billing.provider !== 'geniuspay' && billing.source !== 'geniuspay' && (
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">Accès offert : il n’y a pas d’abonnement à gérer.</p>
        )}
      </section>
    </div>
  )
}

/* -------------------------------------------------------------- Compte */

function AccountSection({ onFlash }: { onFlash: (flash: Flash) => void }) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [deleteText, setDeleteText] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? '')
      setDisplayName(typeof user?.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '')
      setLoaded(true)
    })
  }, [supabase])

  async function saveProfile() {
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName.trim().slice(0, 120) } })
    setBusy(false)
    onFlash(error ? { tone: 'error', text: 'Impossible d’enregistrer votre profil.' } : { tone: 'ok', text: 'Profil enregistré.' })
  }

  async function changeEmail() {
    const nextEmail = newEmail.trim().toLowerCase()
    if (!nextEmail || nextEmail === email.toLowerCase()) return onFlash({ tone: 'error', text: 'Saisissez une nouvelle adresse email.' })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ email: nextEmail })
    setBusy(false)
    if (error) return onFlash({ tone: 'error', text: 'Impossible de demander le changement d’email.' })
    setNewEmail('')
    onFlash({ tone: 'ok', text: 'Vérifiez les emails de confirmation pour terminer le changement.' })
  }

  async function deleteAccount() {
    if (deleteText !== 'SUPPRIMER') return
    setBusy(true)
    const response = await fetch('/api/account', { method: 'DELETE' })
    if (!response.ok) { setBusy(false); return onFlash({ tone: 'error', text: 'Le compte n’a pas pu être supprimé.' }) }
    await supabase.auth.signOut()
    router.push('/login?deleted=1')
  }

  if (!loaded) return <Skeleton className="h-64" />

  return (
    <div className="grid max-w-2xl gap-6">
      <section className={`${surface} p-5 sm:p-6`} aria-labelledby="profile-title">
        <h2 id="profile-title" className="text-lg font-semibold text-gray-950 dark:text-white">Profil</h2>
        <label className="mt-5 block text-sm font-semibold text-gray-800 dark:text-zinc-200">Nom affiché
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} placeholder="Votre nom" className={`${inputClass} mt-2`} />
        </label>
        <label className="mt-4 block text-sm font-semibold text-gray-800 dark:text-zinc-200">Email <span className="font-normal text-gray-500 dark:text-zinc-400">(lecture seule)</span>
          <input value={email} readOnly className={`${inputClass} mt-2 cursor-default bg-gray-50 text-gray-600 dark:bg-white/[0.02] dark:text-zinc-400`} />
        </label>
        <button type="button" onClick={() => void saveProfile()} disabled={busy} className={`${primaryButton} mt-6`}>Enregistrer le profil</button>
        <div className="mt-6 border-t border-gray-200 pt-5 dark:border-white/[0.08]">
          <label className="block text-sm font-semibold text-gray-800 dark:text-zinc-200">Nouvelle adresse email
            <input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} type="email" autoComplete="email" placeholder="nouvelle-adresse@exemple.com" className={`${inputClass} mt-2`} />
          </label>
          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-zinc-400">Une confirmation de sécurité sera demandée avant le remplacement de l’adresse.</p>
          <button type="button" onClick={() => void changeEmail()} disabled={busy || !newEmail} className={`${secondaryButton} mt-4`}>Demander le changement d’email</button>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 p-5 sm:p-6 dark:border-red-500/25" aria-labelledby="account-danger">
        <h2 id="account-danger" className="text-lg font-semibold text-red-700 dark:text-red-300">Supprimer mon compte</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-400">Vos projets, vos avis et vos données sont supprimés définitivement. Pour confirmer, tapez <strong className="font-mono text-gray-950 dark:text-white">SUPPRIMER</strong>.</p>
        <input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} aria-label="Tapez SUPPRIMER pour confirmer" className={`${inputClass} mt-4 font-mono`} />
        <button type="button" onClick={() => void deleteAccount()} disabled={busy || deleteText !== 'SUPPRIMER'} className={`${dangerButton} mt-4`}>Supprimer définitivement mon compte</button>
      </section>
    </div>
  )
}
