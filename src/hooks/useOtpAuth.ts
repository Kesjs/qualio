"use client"

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/i18n/translations'

interface UseOtpAuthReturn {
  isLoading: boolean
  requestOtp: (email: string) => Promise<boolean>
  verifyOtp: (email: string, code: string) => Promise<boolean>
}

export function useOtpAuth(): UseOtpAuthReturn {
  const [isLoading, setIsLoading] = useState(false)
  const { language } = useLanguage()
  const t = translations[language].auth

  const requestOtp = async (email: string): Promise<boolean> => {
    if (!email) {
      toast.error(t.errors.enterEmail)
      return false
    }

    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          // OTP is a sign-in path. Account creation stays explicit in signup.
          shouldCreateUser: false,
          data: { login_method: 'otp' },
        },
      })

      if (error) throw error
      toast.success(t.success.otpSent)
      return true
    } catch (err: any) {
      toast.error(err?.message || t.errors.otpFailed)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (email: string, code: string): Promise<boolean> => {
    if (!email || !code) {
      toast.error(t.errors.missingCode)
      return false
    }

    setIsLoading(true)
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
      toast.error(err?.message === 'Token has expired or is invalid' ? t.errors.invalidCode : err?.message || t.errors.otpVerifyFailed)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, requestOtp, verifyOtp }
}
