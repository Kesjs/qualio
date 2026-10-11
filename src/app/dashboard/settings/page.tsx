'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellIcon, CheckCircleIcon, CreditCardIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useActiveSite } from '@/lib/hooks/useActiveSite'

const TABS = [
  { id: 'profile', label: 'Profil', icon: UserIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'billing', label: 'Abonnement', icon: CreditCardIcon },
  { id: 'security', label: 'Sécurité', icon: ShieldCheckIcon },
] as const
type TabId = (typeof TABS)[number]['id']
type BillingState = { plan: 'free' | 'pro'; label: string; status: string; source: string | null; trialEndsAt: string | null; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; limits: { projects: number; monthlySyntheses: number }; usage: { projects: number; monthlySyntheses: number } }
type NotificationState = { weekly_digest: boolean; consented_at: string | null; consent_source: string | null; unsubscribed_at: string | null }

const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'Europe/Paris' }).format(new Date(value)) : null

export default function SettingsPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { activeSite, isLoading: sitesLoading, refetch: refetchSites } = useActiveSite()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [notificationMeta, setNotificationMeta] = useState<NotificationState | null>(null)
  const [billing, setBilling] = useState<BillingState | null>(null)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const trialDays = billing?.trialEndsAt && billing.source === 'trial' ? Math.max(0, Math.ceil((new Date(billing.trialEndsAt).getTime() - Date.now()) / 86400000)) : null

  async function load() {
    setLoading(true); setError(null)
    try {
      const [{ data: { user } }, notificationResponse, billingResponse] = await Promise.all([
        supabase.auth.getUser(), fetch('/api/settings/notifications'), fetch('/api/billing/status'),
      ])
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      setName(typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '')
      if (notificationResponse.ok) {
        const preferences = await notificationResponse.json() as NotificationState
        setNotificationMeta(preferences); setWeeklyDigest(preferences.weekly_digest)
      }
      if (billingResponse.ok) setBilling(await billingResponse.json() as BillingState)
    } catch {
      setError('Impossible de charger les réglages. Réessayez.')
    } finally { setLoading(false) }
  }

  // The initial load intentionally runs once per settings visit.
  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (success) { const timer = window.setTimeout(() => setSuccess(null), 3500); return () => window.clearTimeout(timer) } }, [success])

  async function saveProfile() {
    setBusy(true); setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ data: { display_name: name.trim().slice(0, 120) } })
    setBusy(false)
    if (updateError) return setError('Impossible d’enregistrer votre profil.')
    setSuccess('Profil enregistré.')
  }

  async function saveNotifications() {
    setBusy(true); setError(null)
    const response = await fetch('/api/settings/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weeklyDigest }) })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) return setError(result.error ?? 'Impossible d’enregistrer cette préférence.')
    setNotificationMeta(result); setSuccess(weeklyDigest ? 'Résumé hebdomadaire activé.' : 'Résumé hebdomadaire désactivé.')
  }

  async function changePassword() {
    if (password.length < 8 || password !== confirmation) return setError(password !== confirmation ? 'Les mots de passe ne correspondent pas.' : 'Le mot de passe doit contenir au moins 8 caractères.')
    setBusy(true); setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) return setError('Impossible de modifier le mot de passe.')
    setPassword(''); setConfirmation(''); setSuccess('Mot de passe modifié.')
  }

  async function openPortal() {
    setBusy(true); setError(null)
    const response = await fetch('/api/billing/portal', { method: 'POST' })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok || !result.url) return setError(result.error ?? 'Le portail de facturation est indisponible.')
    window.location.assign(result.url)
  }

  async function deleteProject() {
    if (!activeSite) return
    if (!window.confirm(`Supprimer le projet « ${activeSite.name || activeSite.url || 'sans nom'} » et tous ses avis ? Cette action est irréversible.`)) return
    setBusy(true); setError(null)
    const response = await fetch(`/api/sites/${activeSite.id}`, { method: 'DELETE' })
    setBusy(false)
    if (!response.ok) return setError('Le projet n’a pas pu être supprimé.')
    window.localStorage.removeItem('qualio:selected-site')
    window.dispatchEvent(new CustomEvent('qualio:project-changed', { detail: {} }))
    await refetchSites(); setSuccess('Projet supprimé.')
  }

  async function deleteAccount() {
    if (!window.confirm('Supprimer votre compte, vos projets et tous vos avis ? Cette action est irréversible.')) return
    setBusy(true); setError(null)
    const response = await fetch('/api/account', { method: 'DELETE' })
    if (!response.ok) { setBusy(false); return setError('Le compte n’a pas pu être supprimé.') }
    await supabase.auth.signOut(); router.push('/login?deleted=1')
  }

  if (loading || sitesLoading) return <SettingsShell><div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-white/10" /><div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" /><div className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" /></div></SettingsShell>

  return <SettingsShell>
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c95720]">Réglages</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">Votre espace, simplement.</h1><p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Profil, notifications, abonnement et sécurité.</p></div>
    {error ? <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"><span>{error}</span><button type="button" onClick={() => void load()} className="min-h-11 rounded-lg px-3 font-semibold underline">Réessayer</button></div> : null}
    {success ? <p role="status" aria-live="polite" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"><CheckCircleIcon className="mr-2 inline h-4 w-4" />{success}</p> : null}
    {trialDays !== null ? <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#ee6018]/25 bg-[#ee6018]/[0.08] p-4 text-sm text-gray-800 dark:text-orange-100 sm:flex-row sm:items-center sm:justify-between"><span>Essai Pro : il vous reste <strong>{trialDays} jour{trialDays > 1 ? 's' : ''}</strong>.</span><button type="button" onClick={() => setActiveTab('billing')} className="min-h-11 rounded-xl bg-[#ee6018] px-4 py-2 text-sm font-bold text-white">Passer en Pro</button></div> : null}
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Sections des réglages" className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">{TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition lg:w-full ${activeTab === id ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#16181e] md:p-7">
        {activeTab === 'profile' ? <Panel title="Profil" description="Ces informations servent à personnaliser votre espace."><label className="block max-w-xl text-sm font-semibold">Nom affiché<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none focus:border-[#ee6018] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" placeholder="Votre nom" /></label><label className="mt-5 block max-w-xl text-sm font-semibold">Email<input value={email} readOnly className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 bg-gray-100 px-4 text-base text-gray-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-500" /></label><SaveButton busy={busy} onClick={saveProfile}>Enregistrer le profil</SaveButton></Panel> : null}
        {activeTab === 'notifications' ? <Panel title="Notifications" description="Vous gardez le contrôle sur le résumé de vos avis."><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-white/10"><input type="checkbox" checked={weeklyDigest} onChange={(event) => setWeeklyDigest(event.target.checked)} className="mt-1 h-5 w-5 accent-[#ee6018]" /><span><strong className="block text-sm">Recevoir le résumé hebdomadaire</strong><span className="mt-1 block text-sm font-normal leading-6 text-gray-500 dark:text-zinc-400">Un email court le lundi avec les évolutions de vos avis et une recommandation à décider. Désinscription possible à tout moment.</span></span></label>{notificationMeta?.consent_source ? <p className="mt-3 text-xs text-gray-500 dark:text-zinc-500">Dernier consentement enregistré depuis {notificationMeta.consent_source === 'signup' ? 'l’inscription' : 'les réglages'}.</p> : null}<SaveButton busy={busy} onClick={saveNotifications}>Enregistrer les notifications</SaveButton></Panel> : null}
        {activeTab === 'billing' ? <Panel title="Abonnement" description="Les limites sont appliquées côté serveur et vos données restent conservées."><BillingCard billing={billing} busy={busy} onPortal={openPortal} onUpgrade={() => router.push('/pricing')} /></Panel> : null}
        {activeTab === 'security' ? <Panel title="Sécurité" description="Modifiez votre mot de passe ou déconnectez les autres appareils."><div className="max-w-xl"><label className="block text-sm font-semibold">Nouveau mot de passe<div className="relative mt-2"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-base outline-none focus:border-[#ee6018] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-1 top-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500">{showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}</button></div></label><label className="mt-4 block text-sm font-semibold">Confirmer le mot de passe<input type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none focus:border-[#ee6018] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><SaveButton busy={busy} onClick={changePassword}>Modifier le mot de passe</SaveButton></div></Panel> : null}
        <div className="mt-8 border-t border-gray-100 pt-7 dark:border-white/[0.06]"><h2 className="text-sm font-semibold text-red-700 dark:text-red-300">Zone de danger</h2><p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Les suppressions sont irréversibles et demandent une confirmation explicite.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => void deleteProject()} disabled={!activeSite || busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-45 dark:border-red-500/20 dark:text-red-300"><TrashIcon className="h-4 w-4" />Supprimer le projet actif</button><button type="button" onClick={() => void deleteAccount()} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-45 dark:border-red-500/20 dark:text-red-300"><TrashIcon className="h-4 w-4" />Supprimer mon compte</button></div></div>
      </section>
    </div>
  </SettingsShell>
}

function SettingsShell({ children }: { children: React.ReactNode }) { return <main className="min-h-full bg-[#fbfbfb] px-4 py-6 text-gray-950 dark:bg-[#0b0c0e] dark:text-white sm:px-6 lg:px-8">{children}</main> }
function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{description}</p><div className="mt-7">{children}</div></div> }
function SaveButton({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={() => void onClick()} disabled={busy} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ee6018] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Enregistrement…' : children}</button> }
function BillingCard({ billing, busy, onPortal, onUpgrade }: { billing: BillingState | null; busy: boolean; onPortal: () => void; onUpgrade: () => void }) {
  if (!billing) return <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-zinc-400">Les informations d’abonnement sont indisponibles. Réessayez.</p>
  const end = billing.source === 'trial' ? billing.trialEndsAt : billing.currentPeriodEnd
  const isPro = billing.plan === 'pro'
  return <div className="max-w-xl rounded-2xl border border-gray-200 p-5 dark:border-white/10"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-semibold">{billing.label}</p><p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{isPro ? `${billing.usage.monthlySyntheses} / ${billing.limits.monthlySyntheses} synthèses utilisées ce mois-ci` : 'Vos avis et vos données restent conservés.'}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${isPro ? 'bg-orange-50 text-[#c95720] dark:bg-orange-500/10 dark:text-orange-200' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-300'}`}>{billing.status === 'trialing' ? 'Essai en cours' : isPro ? 'Actif' : 'Gratuit'}</span></div>{end ? <p className="mt-5 text-sm text-gray-600 dark:text-zinc-300">{billing.source === 'trial' ? 'Fin de l’essai' : 'Prochaine échéance'} : <strong>{dateLabel(end)}</strong></p> : null}<div className="mt-5 flex flex-wrap gap-3">{isPro && billing.source !== 'manual' ? <button type="button" onClick={onPortal} disabled={busy} className="min-h-11 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-white/10">Gérer la facturation</button> : null}{billing.source === 'manual' ? <p className="text-sm text-gray-500 dark:text-zinc-400">Accès offert, pas d’abonnement à gérer.</p> : null}{!isPro ? <button type="button" onClick={onUpgrade} className="min-h-11 rounded-xl bg-[#ee6018] px-4 py-2 text-sm font-bold text-white">Passer en Pro</button> : null}</div></div>
}
