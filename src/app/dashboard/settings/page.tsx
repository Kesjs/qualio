'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  CommandLineIcon,
  CreditCardIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient as createClient } from '@/lib/supabase/client'
import { CheckboxGroup, type CheckboxGroupOption } from '@/components/ui/checkbox-group'

const NOTIFICATION_OPTIONS: CheckboxGroupOption[] = [
  {
    label: 'Alertes de régression',
    value: 'push',
    description: 'Recevoir une alerte quand un scan détecte une régression',
    group: 'Alertes Qualio',
  },
  {
    label: 'Bilan hebdomadaire',
    value: 'email',
    description: 'Recevoir un résumé des tendances et des corrections par email',
    group: 'Alertes Qualio',
  },
  {
    label: 'Alertes critiques par SMS',
    value: 'sms',
    description: 'Être prévenu par SMS lorsqu’une production est bloquée',
    group: 'Alertes Qualio',
  },
  {
    label: 'Intégration Slack',
    value: 'slack',
    description: 'Envoyer les rapports terminés vers un canal QA',
    disabled: true,
    disabledReason: 'Disponible prochainement',
    group: 'Intégrations externes',
  },
  {
    label: 'Webhook Discord',
    value: 'discord',
    description: 'Distribuer les régressions en temps réel à une équipe Discord',
    disabled: true,
    disabledReason: 'Disponible prochainement',
    group: 'Intégrations externes',
  },
]

const TABS = [
  { id: 'profile', label: 'Profil', icon: UserIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'billing', label: 'Abonnement', icon: CreditCardIcon },
  { id: 'integrations', label: 'Intégrations', icon: PuzzlePieceIcon },
  { id: 'api', label: 'API & Webhooks', icon: CommandLineIcon },
  { id: 'security', label: 'Sécurité', icon: ShieldCheckIcon },
] as const

type SettingsTab = (typeof TABS)[number]['id']
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const COMING_SOON_COPY: Record<Exclude<SettingsTab, 'profile' | 'notifications' | 'security' | 'api'>, { title: string; description: string }> = {
  billing: {
    title: 'Abonnement et facturation',
    description: 'La gestion du plan, de la facturation et des factures sera disponible prochainement.',
  },
  integrations: {
    title: 'Intégrations',
    description: 'Connectez Slack, Discord et vos outils de travail depuis cet espace prochainement.',
  },
}

function ComingSoonPanel({ tab }: { tab: Exclude<SettingsTab, 'profile' | 'notifications' | 'security' | 'api'> }) {
  const Icon = TABS.find((item) => item.id === tab)?.icon ?? ClockIcon
  const copy = COMING_SOON_COPY[tab]

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#ee6018]/25 bg-[#ee6018]/10 text-[#ee6018] dark:bg-[#ee6018]/[0.12]">
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </div>
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#ee6018]/25 bg-[#ee6018]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#ee6018]">
        <ClockIcon className="h-3 w-3" />
        Disponible prochainement
      </span>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{copy.title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-zinc-400">{copy.description}</p>
    </div>
  )
}

function BillingPanel() {
  const [billing, setBilling] = useState<{ plan: string; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetch('/api/billing/status').then((response) => response.json()).then(setBilling).catch(() => setError('Impossible de charger votre abonnement.')) }, [])
  async function openPortal() { setLoading(true); setError(''); const response = await fetch('/api/billing/portal', { method: 'POST' }); const result = await response.json().catch(() => ({})); if (!response.ok) setError(result.error ?? 'Le portail de facturation est indisponible.'); else window.location.assign(result.url); setLoading(false) }
  const planLabel = billing?.plan === 'pro' ? 'Pro' : billing?.plan === 'essential' ? 'Essentiel' : 'Gratuit'
  return <div className="space-y-6 p-5 md:p-7"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ee6018]">Abonnement</p><h2 className="mt-2 text-base font-semibold text-gray-900 dark:text-white">Votre plan Qualio</h2><p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Le plan actif est confirmé par Stripe et contrôlé côté serveur.</p></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-200">{error}</p>}<div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"><div><span className="text-xs text-gray-500 dark:text-zinc-400">Plan actuel</span><strong className="mt-1 block text-2xl text-gray-950 dark:text-white">{billing ? planLabel : 'Chargement…'}</strong>{billing?.currentPeriodEnd && <span className="mt-1 block text-xs text-gray-500 dark:text-zinc-400">Période jusqu’au {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(billing.currentPeriodEnd))}{billing.cancelAtPeriodEnd ? ' · résiliation prévue' : ''}</span>}</div>{billing?.plan !== 'free' && <button type="button" onClick={openPortal} disabled={loading} className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-bold hover:border-gray-400 disabled:opacity-50 dark:border-white/10">{loading ? 'Ouverture…' : 'Gérer la facturation'}</button>}</div><p className="text-xs leading-5 text-gray-500 dark:text-zinc-400">Vous pouvez modifier votre moyen de paiement, consulter vos factures ou annuler depuis le portail sécurisé Stripe.</p></div>
}

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [notificationPreferences, setNotificationPreferences] = useState<string[]>(['push', 'email'])
  const [isLoading, setIsLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [passwordState, setPasswordState] = useState<SaveState>('idle')
  const [passwordError, setPasswordError] = useState('')
  const [sessionState, setSessionState] = useState<SaveState>('idle')
  const [sessionError, setSessionError] = useState('')
  const initialValues = useRef({ fullName: '', notificationPreferences: ['push', 'email'] })

  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (!mounted) return

      if (error || !data.user) {
        setSaveError('Impossible de charger les paramètres du compte.')
        setIsLoading(false)
        return
      }

      const metadata = data.user.user_metadata ?? {}
      const loadedName = typeof metadata.full_name === 'string' ? metadata.full_name : ''
      const loadedPreferences = Array.isArray(metadata.notification_preferences)
        ? metadata.notification_preferences.filter((value): value is string => typeof value === 'string')
        : ['push', 'email']

      setUserEmail(data.user.email ?? null)
      setFullName(loadedName)
      setNotificationPreferences(loadedPreferences)
      initialValues.current = { fullName: loadedName, notificationPreferences: loadedPreferences }
      setIsLoading(false)
    }

    loadSettings()
    return () => {
      mounted = false
    }
  }, [])

  const isDirty =
    fullName !== initialValues.current.fullName ||
    JSON.stringify(notificationPreferences) !== JSON.stringify(initialValues.current.notificationPreferences)

  const handleSave = async () => {
    if (!isDirty || saveState === 'saving') return

    setSaveState('saving')
    setSaveError('')

    try {
      const supabase = createClient()
      const { data, error: userError } = await supabase.auth.getUser()
      if (userError || !data.user) throw new Error('Session introuvable')

      const { error } = await supabase.auth.updateUser({
        data: {
          ...data.user.user_metadata,
          full_name: fullName.trim(),
          notification_preferences: notificationPreferences,
        },
      })

      if (error) throw error

      initialValues.current = {
        fullName: fullName.trim(),
        notificationPreferences,
      }
      setFullName(fullName.trim())
      setSaveState('saved')
    } catch {
      setSaveState('error')
      setSaveError('Les modifications n’ont pas pu être enregistrées. Réessayez.')
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordState('error')
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordState('error')
      setPasswordError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setPasswordState('saving')
    setPasswordError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordState('error')
      setPasswordError(error.message || 'Le mot de passe n’a pas pu être modifié.')
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setPasswordState('saved')
  }

  const handleSignOutOtherSessions = async () => {
    setSessionState('saving')
    setSessionError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signOut({ scope: 'others' })

    if (error) {
      setSessionState('error')
      setSessionError('Les autres sessions n’ont pas pu être déconnectées.')
      return
    }

    setSessionState('saved')
  }

  const isSaving = saveState === 'saving'
  const activeTabIsComingSoon = activeTab === 'integrations'

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ee6018]">Compte</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Paramètres</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-zinc-400">
          Gérez votre profil et vos préférences de suivi des régressions.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <nav aria-label="Sections des paramètres" className="w-full shrink-0 md:w-56">
          <div className="space-y-1" role="tablist" aria-orientation="vertical">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`settings-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`settings-panel-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSaveState('idle')
                    setSaveError('')
                  }}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/50 ${
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2 : 1.7} />
                  <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                  {'comingSoon' in tab && tab.comingSoon ? (
                    <span className={`font-mono text-[9px] uppercase tracking-[0.08em] ${isActive ? 'text-gray-500 dark:text-gray-500' : 'text-gray-400 dark:text-zinc-600'}`}>
                      Soon
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </nav>

        <section className="min-w-0 flex-1" aria-live="polite">
          <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]">
            {activeTabIsComingSoon ? (
              <div id={`settings-panel-${activeTab}`} role="tabpanel" aria-labelledby={`settings-tab-${activeTab}`}>
                <ComingSoonPanel tab={activeTab} />
              </div>
            ) : null}

            {activeTab === 'billing' ? <div id="settings-panel-billing" role="tabpanel" aria-labelledby="settings-tab-billing"><BillingPanel /></div> : null}

            {activeTab === 'profile' ? (
              <div id="settings-panel-profile" role="tabpanel" aria-labelledby="settings-tab-profile" className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="space-y-6 p-5 md:p-7">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Informations personnelles</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Ces informations servent à personnaliser votre espace Qualio.</p>
                  </div>

                  <div className="max-w-xl space-y-5">
                    <div>
                      <label htmlFor="settings-email" className="mb-2 block text-xs font-medium text-gray-700 dark:text-zinc-300">Adresse email</label>
                      <input
                        id="settings-email"
                        type="email"
                        value={isLoading ? 'Chargement…' : userEmail ?? 'Email indisponible'}
                        disabled
                        className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 outline-none dark:border-white/[0.08] dark:bg-[#111216] dark:text-zinc-500"
                      />
                      <p className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500">L’email est géré par Supabase Auth et ne peut pas être modifié ici.</p>
                    </div>

                    <div>
                      <label htmlFor="settings-full-name" className="mb-2 block text-xs font-medium text-gray-700 dark:text-zinc-300">Nom complet</label>
                      <input
                        id="settings-full-name"
                        type="text"
                        value={fullName}
                        onChange={(event) => {
                          setFullName(event.target.value)
                          setSaveState('idle')
                        }}
                        placeholder="Votre nom complet"
                        disabled={isLoading}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#ee6018] focus:ring-2 focus:ring-[#ee6018]/15 disabled:cursor-wait disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#111216] dark:text-white dark:placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'notifications' ? (
              <div id="settings-panel-notifications" role="tabpanel" aria-labelledby="settings-tab-notifications" className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="space-y-6 p-5 md:p-7">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Préférences de notification</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Choisissez comment Qualio doit vous prévenir lorsqu’un scan détecte une régression.</p>
                  </div>

                  <div className="max-w-xl rounded-xl border border-gray-200/80 bg-gray-50/60 p-2 dark:border-white/[0.06] dark:bg-white/[0.015]">
                    <CheckboxGroup
                      options={NOTIFICATION_OPTIONS}
                      value={notificationPreferences}
                      onChange={(value) => {
                        setNotificationPreferences(value)
                        setSaveState('idle')
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'security' ? (
              <div id="settings-panel-security" role="tabpanel" aria-labelledby="settings-tab-security" className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="space-y-8 p-5 md:p-7">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sécurité du compte</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Protégez votre accès et gardez le contrôle de vos sessions actives.</p>
                  </div>

                  <div className="max-w-xl space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Modifier le mot de passe</h3>
                      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-zinc-500">Utilisez au moins 8 caractères. La session actuelle restera ouverte.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="settings-new-password" className="mb-2 block text-xs font-medium text-gray-700 dark:text-zinc-300">Nouveau mot de passe</label>
                        <div className="relative">
                          <input
                            id="settings-new-password"
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(event) => {
                              setNewPassword(event.target.value)
                              setPasswordState('idle')
                              setPasswordError('')
                            }}
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-[#ee6018] focus:ring-2 focus:ring-[#ee6018]/15 dark:border-white/[0.08] dark:bg-[#111216] dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setIsPasswordVisible((visible) => !visible)}
                            aria-label={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ee6018]/50 dark:text-zinc-500 dark:hover:text-white"
                          >
                            {isPasswordVisible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="settings-confirm-password" className="mb-2 block text-xs font-medium text-gray-700 dark:text-zinc-300">Confirmer le mot de passe</label>
                        <input
                          id="settings-confirm-password"
                          type={isPasswordVisible ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value)
                            setPasswordState('idle')
                            setPasswordError('')
                          }}
                          autoComplete="new-password"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#ee6018] focus:ring-2 focus:ring-[#ee6018]/15 dark:border-white/[0.08] dark:bg-[#111216] dark:text-white"
                        />
                      </div>
                    </div>

                    {passwordError ? <p className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400"><ExclamationCircleIcon className="h-4 w-4 shrink-0" />{passwordError}</p> : null}
                    {passwordState === 'saved' ? <p className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="h-4 w-4 shrink-0" />Mot de passe modifié.</p> : null}

                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={passwordState === 'saving' || !newPassword || !confirmPassword}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#d95514] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:focus-visible:ring-offset-[#181B21]"
                    >
                      {passwordState === 'saving' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" /> : null}
                      {passwordState === 'saving' ? 'Modification…' : 'Modifier le mot de passe'}
                    </button>
                  </div>

                  <div className="max-w-xl border-t border-gray-100 pt-6 dark:border-white/[0.06]">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sessions actives</h3>
                    <p className="mt-1 max-w-lg text-xs leading-5 text-gray-500 dark:text-zinc-500">Déconnectez les autres appareils sans interrompre votre session actuelle.</p>
                    <button
                      type="button"
                      onClick={handleSignOutOtherSessions}
                      disabled={sessionState === 'saving'}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.1] dark:bg-[#111216] dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-white/[0.04]"
                    >
                      {sessionState === 'saving' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700 dark:border-zinc-600 dark:border-t-white" /> : null}
                      {sessionState === 'saving' ? 'Déconnexion…' : 'Déconnecter les autres sessions'}
                    </button>
                    {sessionError ? <p className="mt-3 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400"><ExclamationCircleIcon className="h-4 w-4 shrink-0" />{sessionError}</p> : null}
                    {sessionState === 'saved' ? <p className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="h-4 w-4 shrink-0" />Les autres sessions ont été déconnectées.</p> : null}
                  </div>

                  <div className="max-w-xl rounded-lg border border-dashed border-gray-200 px-4 py-3 dark:border-white/[0.08]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400 dark:text-zinc-500">Disponible prochainement</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Authentification à deux facteurs et passkeys.</p>
                  </div>
                </div>
              </div>
            ) : null}


            {activeTab === 'profile' || activeTab === 'notifications' ? (
              <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-white/[0.06] dark:bg-[#111216]/60 md:flex-row md:items-center md:justify-between md:px-7">
                <div className="flex min-h-8 items-center gap-2 text-xs">
                  {saveState === 'saved' ? <CheckCircleIcon className="h-4 w-4 text-emerald-500" /> : null}
                  {saveState === 'error' ? <ExclamationCircleIcon className="h-4 w-4 text-rose-500" /> : null}
                  <span className={saveState === 'error' ? 'text-rose-600 dark:text-rose-400' : saveState === 'saved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-500'}>
                    {saveState === 'saved' ? 'Modifications enregistrées' : saveState === 'error' ? saveError : isDirty ? 'Modifications non enregistrées' : 'Tout est à jour'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading || isSaving || !isDirty}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#d95514] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:focus-visible:ring-offset-[#111216]"
                >
                  {isSaving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" /> : <CheckCircleIcon className="h-4 w-4" />}
                  {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
