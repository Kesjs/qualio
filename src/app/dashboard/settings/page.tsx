'use client'

import { useState, useEffect } from 'react'
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  PuzzlePieceIcon,
  CommandLineIcon,
  CheckCircleIcon,
  XMarkIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient as createClient } from '@/lib/supabase/client'
import { CheckboxGroup, type CheckboxGroupOption } from '@/components/ui/checkbox-group'

const NOTIFICATION_OPTIONS: CheckboxGroupOption[] = [
  {
    label: "Push notifications",
    value: "push",
    description: "Get instant alerts on your devices when a regression is detected",
    group: "Direct Alerts",
  },
  {
    label: "Email digest",
    value: "email",
    description: "A weekly summary in your inbox covering health trends and fixes",
    group: "Direct Alerts",
  },
  {
    label: "SMS alerts",
    value: "sms",
    description: "Text messages for critical production-breaking incidents",
    group: "Direct Alerts",
  },
  {
    label: "Slack integration",
    value: "slack",
    description: "Send automated reports to your #qa channel on every completed run",
    disabled: true,
    disabledReason: "Available on the Team plan",
    group: "External Integrations",
  },
  {
    label: "Discord webhook",
    value: "discord",
    description: "Real-time regression notifications dispatched to Discord servers",
    disabled: true,
    disabledReason: "Available on the Team plan",
    group: "External Integrations",
  },
]

const TABS = [
  { id: 'profile', label: 'Profil', icon: UserIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'billing', label: 'Abonnement', icon: CreditCardIcon },
  { id: 'integrations', label: 'Intégrations', icon: PuzzlePieceIcon },
  { id: 'api', label: 'API & Webhooks', icon: CommandLineIcon },
  { id: 'security', label: 'Sécurité', icon: ShieldCheckIcon },
]

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [notificationPreferences, setNotificationPreferences] = useState<string[]>(['push', 'email'])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data && data.user) {
        setUserEmail(data.user.email ?? null)
      }
    })
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 800)
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
          Paramètres
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Configurez vos préférences, gérez votre abonnement et configurez vos intégrations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <nav className="w-full md:w-56 flex flex-col gap-1 shrink-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'stroke-2' : ''}`} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1">
          <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:bg-[#16181E] dark:border-white/[0.08] overflow-hidden transition-all">
            
            {/* Profil Tab */}
            {activeTab === 'profile' && (
              <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Informations Personnelles</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    Gérez les informations associées à votre compte Reachly.
                  </p>
                </div>

                <div className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      value={userEmail || 'Chargement...'}
                      disabled
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 dark:bg-[#111216] dark:border-white/[0.08] dark:text-zinc-500 focus:outline-none cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">L'email est géré par Supabase Auth et ne peut être modifié ici.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-white transition-shadow"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Préférences de notification</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    Choisissez quand et comment vous souhaitez être alerté des régressions critiques et des bilans QA.
                  </p>
                </div>

                <div className="max-w-xl rounded-xl border border-gray-200/80 bg-gray-50/30 p-2 dark:border-white/[0.06] dark:bg-white/[0.01]">
                  <CheckboxGroup
                    options={NOTIFICATION_OPTIONS}
                    value={notificationPreferences}
                    onChange={setNotificationPreferences}
                  />
                </div>
              </div>
            )}

            {/* Other Tabs Placeholder */}
            {['billing', 'integrations', 'api', 'security'].includes(activeTab) && (
              <div className="p-12 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#ee6018] border border-orange-100 dark:bg-[#ee6018]/15 dark:text-[#ff7836] dark:border-[#ee6018]/30 mb-4">
                  <PuzzlePieceIcon className="h-6 w-6 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white font-sans">
                  Section en construction
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-sm mx-auto">
                  Cette partie des paramètres est en cours de développement. Elle permettra de gérer votre abonnement, vos intégrations externes et clés API.
                </p>
              </div>
            )}

            {/* Save Footer */}
            {(activeTab === 'profile' || activeTab === 'notifications') && (
              <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-[#111216]/50 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                  Modifications non enregistrées
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" />
                  )}
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
