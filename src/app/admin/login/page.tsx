'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function safeRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/admin'
  return value
}

export default function AdminLoginPage() {
  const searchParams = useSearchParams()
  const redirectPath = safeRedirect(searchParams.get('redirectTo'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'not_admin') {
      toast.error('Ce compte Google n’est pas autorisé pour la console admin.')
    }
    if (searchParams.get('error') === 'auth_callback_failed') {
      toast.error('La connexion Google n’a pas pu être finalisée. Réessayez.')
    }
    getSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user) window.location.replace(redirectPath)
    })
  }, [redirectPath])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email || (!forgot && !password)) return toast.error('Renseignez les champs requis.')
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=${encodeURIComponent(redirectPath)}`,
        })
        if (error) throw error
        toast.success('Le lien de réinitialisation a été envoyé.')
        return
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.replace(redirectPath)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  async function continueWithGoogle() {
    setGoogleLoading(true)
    const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `https://admin.tryqualio.pro/auth/callback?next=${encodeURIComponent(redirectPath)}` },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0C0E] px-5 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/[0.09] bg-[#111216] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-[#17191F] p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black p-2"><img src="/qualio-logo/export/mark/monogram-orange.svg" alt="" className="h-full w-full" /></span><span className="text-lg font-bold">Qualio <span className="text-[#ee6018]">Admin</span></span></div>
            <p className="mt-24 max-w-sm text-5xl font-semibold leading-[1.05] tracking-tight">Piloter le produit avec les vrais retours.</p>
            <p className="mt-6 max-w-md text-sm leading-7 text-zinc-400">Une console réservée à l’équipe Qualio pour suivre l’activation, comprendre les blocages et transformer chaque retour en décision.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500"><LockKeyhole size={14} /> Accès interne protégé</div>
        </section>
        <section className="flex items-center justify-center bg-[#F4F5F3] p-6 text-[#111216] sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden"><span className="font-bold">Qualio <span className="text-[#ee6018]">Admin</span></span></div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ee6018]">Console interne</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">{forgot ? 'Réinitialiser l’accès' : 'Connexion administrateur'}</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{forgot ? 'Recevez un lien sécurisé sur votre adresse administrateur.' : 'Connectez-vous avec votre compte autorisé Qualio.'}</p>
            <form onSubmit={submit} className="mt-9 space-y-4">
              <label className="block text-sm font-semibold text-zinc-800">Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-[15px] text-zinc-950 placeholder:text-zinc-500 outline-none transition focus:border-[#ee6018] focus:ring-2 focus:ring-[#ee6018]/15" placeholder="admin@qualio.app" /></label>
              {!forgot && <label className="block text-sm font-semibold text-zinc-800">Mot de passe<div className="relative mt-2"><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 pr-12 text-[15px] text-zinc-950 placeholder:text-zinc-500 outline-none transition focus:border-[#ee6018] focus:ring-2 focus:ring-[#ee6018]/15" placeholder="Votre mot de passe" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-zinc-600" aria-label="Afficher le mot de passe">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>}
              <button disabled={loading} className="h-12 w-full rounded-xl bg-[#ee6018] font-semibold text-white transition hover:bg-[#d95110] disabled:opacity-60">{loading ? 'Veuillez patienter…' : forgot ? 'Envoyer le lien' : 'Se connecter'}</button>
            </form>
            {!forgot && <>
              <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-400"><span className="h-px flex-1 bg-zinc-200" /> ou <span className="h-px flex-1 bg-zinc-200" /></div>
              <button type="button" onClick={continueWithGoogle} disabled={loading || googleLoading} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white font-semibold text-zinc-800 transition hover:border-zinc-500 disabled:opacity-60">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {googleLoading ? 'Redirection…' : 'Continuer avec Google'}
              </button>
            </>}
            <button type="button" onClick={() => setForgot(!forgot)} className="mt-5 text-sm text-zinc-500 underline underline-offset-4">{forgot ? 'Retour à la connexion' : 'Mot de passe oublié ?'}</button>
            <p className="mt-12 border-t border-zinc-200 pt-5 text-xs leading-5 text-zinc-400">Cette page ne crée aucun compte. L’accès est accordé uniquement aux administrateurs configurés dans Qualio.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
