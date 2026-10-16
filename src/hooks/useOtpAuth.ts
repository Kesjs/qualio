"use client"

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/i18n/translations'

interface UseOtpAuthReturn {
  isLoading: boolean
  error: string | null
  requestOtp: (email: string) => Promise<boolean>
  verifyOtp: (email: string, code: string) => Promise<boolean>
}

export function useOtpAuth(): UseOtpAuthReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()
  const t = translations[language].auth

  const requestOtp = async (email: string): Promise<boolean> => {
    if (!email) {
      toast.error(t.errors.enterEmail)
      return false
    }

    setIsLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          // OTP is a sign-in path. Account creation stays explicit in signup.
          shouldCreateUser: false,
          emailRedirectTo: (() => {
            const params = new URLSearchParams(window.location.search)
            const next = params.get('redirectTo')
            return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard')}`
          })(),
          data: { login_method: 'otp' },
        },
      })

      if (error) throw error
      toast.success(t.success.otpSent)
      return true
    } catch (err: any) {
      const message = t.errors.otpFailed
      setError(message)
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (email: string, code: string): Promise<boolean> => {
    if (!email || !/^\d{6}$/.test(code)) {
      toast.error(t.errors.missingCode)
      return false
    }

    setIsLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'email',
      })

      if (error) throw error
      toast.success(t.success.otpVerified)
      return true
    } catch (err: any) {
      const message = err?.message === 'Token has expired or is invalid' ? t.errors.invalidCode : t.errors.otpVerifyFailed
      setError(message)
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, requestOtp, verifyOtp }
}
