'use client'

import { FormEvent, Suspense, useEffect, useId, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function safeRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/admin'
  return value
}

const URL_ERRORS: Record<string, string> = {
  not_admin: 'Ce compte n’est pas autorisé pour la console admin.',
  auth_callback_failed: 'La connexion Google n’a pas pu être finalisée. Réessayez.',
  oauth_state_expired: 'Cette tentative de connexion Google a expiré. Recommencez.',
}

const FOCUS_LIGHT = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c]'
const INPUT = `h-12 w-full rounded-xl border border-zinc-400 bg-white px-4 text-[15px] text-zinc-950 placeholder:text-zinc-500 ${FOCUS_LIGHT}`

function AdminLoginForm() {
  const searchParams = useSearchParams()
  const redirectPath = safeRedirect(searchParams.get('redirectTo'))
  const uid = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(URL_ERRORS[searchParams.get('error') ?? ''] ?? null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user) window.location.replace(redirectPath)
    })
  }, [redirectPath])

  function switchMode() {
    setForgot((value) => !value)
    setError(null)
    setNotice(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!email || (!forgot && !password)) return setError('Renseignez les champs requis.')
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      if (forgot) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=${encodeURIComponent(redirectPath)}`,
        })
        if (resetError) throw resetError
        setNotice('Si cette adresse est autorisée, un lien de réinitialisation vient d’être envoyé.')
        return
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      window.location.replace(redirectPath)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  async function continueWithGoogle() {
    setError(null)
    setGoogleLoading(true)
    const { error: oauthError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `https://admin.tryqualio.pro/auth/callback?next=${encodeURIComponent(redirectPath)}` },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  const describedBy = error ? `${uid}-erreur` : undefined
  return (
    <main className="min-h-dvh bg-[#101010] px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#161413] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <section aria-hidden="true" className="hidden flex-col justify-between bg-[#1d1a18] p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black p-2"><img src="/qualio-logo/export/mark/monogram-orange.svg" alt="" width={40} height={40} className="h-full w-full" /></span><span className="text-lg font-bold">Qualio <span className="text-[#ff9a66]">Admin</span></span></div>
            <p className="mt-24 max-w-sm text-5xl font-semibold leading-[1.05] tracking-tight">Piloter le produit avec les vrais retours.</p>
            <p className="mt-6 max-w-md text-sm leading-7 text-stone-400">Une console réservée à l’équipe Qualio pour suivre l’activation, comprendre les blocages et transformer chaque retour en décision.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400"><LockKeyhole size={14} /> Accès interne protégé</div>
        </section>
        <section className="flex items-center justify-center bg-[#F4F5F3] p-6 text-[#161413] sm:p-12">
          <div className="w-full max-w-md">
            <p className="mb-10 font-bold lg:hidden">Qualio <span className="text-[#b7410e]">Admin</span></p>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#b7410e]">Console interne</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">{forgot ? 'Réinitialiser l’accès' : 'Connexion administrateur'}</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{forgot ? 'Recevez un lien sécurisé sur votre adresse administrateur.' : 'Connectez-vous avec votre compte autorisé Qualio.'}</p>

            <div className="mt-6 min-h-6" aria-live="polite">
              {error && <p id={`${uid}-erreur`} role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
              {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{notice}</p>}
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4" aria-busy={loading}>
              <div>
                <label htmlFor={`${uid}-email`} className="block text-sm font-semibold text-zinc-800">Email</label>
                <input id={`${uid}-email`} value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required aria-describedby={describedBy} className={`${INPUT} mt-2`} placeholder="admin@qualio.app" />
              </div>
              {!forgot && (
                <div>
                  <label htmlFor={`${uid}-mdp`} className="block text-sm font-semibold text-zinc-800">Mot de passe</label>
                  <div className="relative mt-2">
                    <input id={`${uid}-mdp`} value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required aria-describedby={describedBy} className={`${INPUT} pr-14`} placeholder="Votre mot de passe" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword} aria-controls={`${uid}-mdp`} aria-label="Afficher le mot de passe" className={`absolute right-1 top-1 flex h-10 w-11 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-200 ${FOCUS_LIGHT}`}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
                  </div>
                </div>
              )}
              <button disabled={loading} className={`h-12 w-full rounded-xl bg-[#c2410c] font-semibold text-white transition-colors hover:bg-[#9a3412] disabled:opacity-60 ${FOCUS_LIGHT}`}>{loading ? 'Veuillez patienter…' : forgot ? 'Envoyer le lien' : 'Se connecter'}</button>
            </form>

            {!forgot && (
              <>
                <div role="separator" aria-label="ou" className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600"><span className="h-px flex-1 bg-zinc-300" /> ou <span className="h-px flex-1 bg-zinc-300" /></div>
                <button type="button" onClick={continueWithGoogle} disabled={loading || googleLoading} className={`flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-400 bg-white font-semibold text-zinc-900 transition-colors hover:border-zinc-600 disabled:opacity-60 ${FOCUS_LIGHT}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {googleLoading ? 'Redirection…' : 'Continuer avec Google'}
                </button>
              </>
            )}
            <button type="button" onClick={switchMode} className={`mt-5 min-h-11 rounded text-sm font-medium text-zinc-700 underline underline-offset-4 ${FOCUS_LIGHT}`}>{forgot ? 'Retour à la connexion' : 'Mot de passe oublié ?'}</button>
            <p className="mt-10 border-t border-zinc-300 pt-5 text-xs leading-5 text-zinc-600">Cette page ne crée aucun compte. L’accès est accordé uniquement aux administrateurs configurés dans Qualio.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-[#101010] text-sm text-stone-300" role="status">Chargement…</main>}>
      <AdminLoginForm />
    </Suspense>
  )
}
