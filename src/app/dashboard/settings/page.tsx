'use client'

import { useState, useEffect } from 'react'
import {
  Cog8ToothIcon as Settings,
  BellIcon as Bell,
  KeyIcon as Key,
  CreditCardIcon as CreditCard,
  ShieldCheckIcon as Shield,
  ArrowDownOnSquareIcon as Save,
} from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient as createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [emailAlerts, setEmailAlerts] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data && data.user) {
        setUserEmail(data.user.email ?? null)
      }
    })
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
          Paramètres du compte
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Configurez vos préférences d'espace de travail et vos informations personnelles.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:bg-[#16181E] dark:border-white/[0.08] space-y-6">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Mon Profil
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Gérez vos informations de connexion (récupérées depuis Supabase).
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              Adresse Email
            </label>
            <input
              type="email"
              value={userEmail || 'Chargement...'}
              disabled
              className="w-full max-w-md px-3.5 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 dark:bg-[#111216] dark:border-white/[0.08] dark:text-zinc-500 focus:outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Notifications de régression</h3>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
              Recevoir un email immédiat dès qu'un scan détecte un bug critique.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailAlerts(!emailAlerts)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              emailAlerts ? 'bg-[#ee6018]' : 'bg-gray-200 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                emailAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06] flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  )
}
