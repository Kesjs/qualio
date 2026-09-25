"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { AuthLayout, AuthInput, AuthButton, AuthDivider } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { useOtpAuth } from '@/hooks/useOtpAuth'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/i18n/translations'

const C = {
  orange: '#ee6018', granite: '#8a8380', bone: '#eeeeee',
  ash: '#222222', stone: '#b8b3b0', carbon: '#0d0d0d',
}

type AuthMode = 'password' | 'register' | 'forgot' | 'otp' | 'otp-verify' | 'verify-email'

// Bouton Google SSO
function GoogleButton({ onClick, loading, label }: { onClick: () => void; loading: boolean, label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', padding: '9px 16px',
        background: C.carbon, border: `1px solid ${C.ash}`, borderRadius: 3,
        color: C.bone, fontFamily: "'Manrope',sans-serif", fontSize: 14, fontWeight: 400,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'border-color 0.15s ease',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.stone)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.ash)}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get('mode') as AuthMode) || 'password'
  )

  const { language } = useLanguage()
  const t = translations[language].auth

  const { isLoading: otpLoading, requestOtp, verifyOtp } = useOtpAuth()

  // Redirect si dÃ©jÃ  connectÃ©
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }: Awaited<ReturnType<typeof supabase.auth.getSession>>) => {
      if (data?.session?.user) router.replace('/dashboard')
    })
  }, [router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpError, setOtpError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // --- Password sign-in ---
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error(t.errors.fillAll); return }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success(t.success.signedIn)
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err?.message === 'Invalid login credentials' ? t.errors.incorrect : err?.message || t.errors.signinFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Register ---
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error(t.errors.fillAll); return }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      toast.success(t.success.accountCreated)
      setMode('verify-email')
    } catch (err: any) {
      toast.error(err?.message || t.errors.registerFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Forgot password ---
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { toast.error(t.errors.enterEmail); return }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      if (error) throw error
      toast.success(t.success.resetSent)
    } catch (err: any) {
      toast.error(err?.message || t.errors.resetFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // --- OTP request ---
  async function handleOtpRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { toast.error(t.errors.enterEmail); return }
    const ok = await requestOtp(email)
    if (ok) {
      setOtpEmail(email)
      setMode('otp-verify')
    }
  }

  // --- OTP verify ---
  async function handleOtpVerify(code: string) {
    setOtpError(false)
    const ok = await verifyOtp(otpEmail, code)
    if (ok) {
      router.replace('/dashboard')
    } else {
      setOtpError(true)
    }
  }

  // --- Google OAuth ---
  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err?.message || 'Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  let modeKey: keyof typeof t = mode as keyof typeof t;
  if (mode === 'otp-verify') modeKey = 'otpVerify';
  if (mode === 'verify-email') modeKey = 'verifyEmail';
  const currentModeCopy = t[modeKey] as { title: string; description: string };

  return (
    <AuthLayout title={currentModeCopy.title} description={currentModeCopy.description} showBack>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* â”€â”€ PASSWORD mode â”€â”€ */}
            {mode === 'password' && (
              <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AuthInput
                  label={t.labels.email}
                  type="email"
                  placeholder={t.labels.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <AuthInput
                  label={t.labels.password}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.labels.passwordPlaceholderSignIn}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  rightEl={
                    <span onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </span>
                  }
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Manrope',sans-serif", fontSize: 12, color: C.granite }}
                  >
                    {t.labels.forgot}
                  </button>
                </div>
                <AuthButton loading={isLoading} type="submit">{t.labels.signIn}</AuthButton>
              </form>
            )}

            {/* â”€â”€ REGISTER mode â”€â”€ */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AuthInput
                  label={t.labels.email}
                  type="email"
                  placeholder={t.labels.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <AuthInput
                  label={t.labels.password}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.labels.passwordPlaceholderSignUp}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  rightEl={
                    <span onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </span>
                  }
                />
                <AuthButton loading={isLoading} type="submit">{t.labels.createAccount}</AuthButton>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.granite, textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.5 }}>
                  {t.labels.termsPre} <a href="/terms" style={{ color: C.stone, textDecoration: 'underline' }}>{t.labels.terms}</a> {t.labels.and} <a href="/privacy" style={{ color: C.stone, textDecoration: 'underline' }}>{t.labels.privacy}</a>
                </p>
              </form>
            )}

            {/* verify email mode */}
            {mode === 'verify-email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: C.granite, margin: 0, lineHeight: 1.5 }}>
                  {t.labels.codeSentTo} <strong style={{ color: C.stone }}>{email}</strong>.
                  Veuillez cliquer sur le lien dans l'email pour activer votre compte.
                </p>
                <AuthButton variant="ghost" type="button" onClick={() => setMode('password')}>
                  {t.labels.backToSignIn}
                </AuthButton>
              </div>
            )}

            {/* â”€â”€ FORGOT mode â”€â”€ */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AuthInput
                  label={t.labels.email}
                  type="email"
                  placeholder={t.labels.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <AuthButton loading={isLoading} type="submit">{t.labels.sendReset}</AuthButton>
                <AuthButton variant="ghost" type="button" onClick={() => setMode('password')}>{t.labels.backToSignIn}</AuthButton>
              </form>
            )}

            {/* â”€â”€ OTP request mode â”€â”€ */}
            {mode === 'otp' && (
              <form onSubmit={handleOtpRequest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AuthInput
                  label={t.labels.email}
                  type="email"
                  placeholder={t.labels.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <AuthButton loading={otpLoading} type="submit">{t.labels.sendCode}</AuthButton>
                <AuthButton variant="ghost" type="button" onClick={() => setMode('password')}>{t.labels.signInPasswordInstead}</AuthButton>
              </form>
            )}

            {/* â”€â”€ OTP verify mode â”€â”€ */}
            {mode === 'otp-verify' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.granite, margin: 0 }}>
                  {t.labels.codeSentTo} <span style={{ color: C.stone }}>{otpEmail}</span>
                </p>
                <OtpInput
                  onComplete={handleOtpVerify}
                  error={otpError}
                  disabled={otpLoading}
                />
                {otpError && (
                  <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: '#ef4444', margin: 0 }}>
                    {t.errors.invalidCode}
                  </p>
                )}
                <AuthButton
                  variant="ghost"
                  type="button"
                  loading={otpLoading}
                  onClick={() => { setOtpEmail(''); setMode('otp') }}
                >
                  {t.labels.resendCode}
                </AuthButton>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* SSO ── Google (pas sur otp-verify ni verify-email) */}
        {mode !== 'otp-verify' && mode !== 'verify-email' && (
          <>
            <AuthDivider />
            <GoogleButton onClick={handleGoogle} loading={googleLoading} label={t.labels.continueWithGoogle} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setMode('otp')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.granite }}
              >
                {t.labels.signInOtp}
              </button>
            </div>
          </>
        )}

        {/* Mode switcher password â†” register */}
        {(mode === 'password' || mode === 'register') && (
          <p style={{ textAlign: 'center', fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.granite, margin: 0 }}>
            {mode === 'password' ? (
              <>{t.labels.noAccount}{' '}
                <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.stone, textDecoration: 'underline' }}>
                  {t.labels.signUp}
                </button>
              </>
            ) : (
              <>{t.labels.alreadyHave}{' '}
                <button onClick={() => setMode('password')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.stone, textDecoration: 'underline' }}>
                  {t.labels.signIn}
                </button>
              </>
            )}
          </p>
        )}

      </div>
    </AuthLayout>
  )
}
