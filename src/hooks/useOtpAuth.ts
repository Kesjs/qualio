"use client"

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UseOtpAuthReturn {
  isLoading: boolean
  requestOtp: (email: string) => Promise<boolean>
  verifyOtp: (email: string, code: string) => Promise<boolean>
}

export function useOtpAuth(): UseOtpAuthReturn {
  const [isLoading, setIsLoading] = useState(false)

  const requestOtp = async (email: string): Promise<boolean> => {
    if (!email) {
      toast.error('Please enter your email address')
      return false
    }

    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true, // Crée un compte si l'email est inconnu
          data: { login_method: 'otp' },
        },
      })

      if (error) throw error
      toast.success('Code sent! Check your inbox.')
      return true
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send code')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (email: string, code: string): Promise<boolean> => {
    if (!email || !code) {
      toast.error('Missing email or code')
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
      toast.success('Verified! Signing you in…')
      return true
    } catch (err: any) {
      toast.error(err?.message === 'Token has expired or is invalid' ? 'Invalid or expired code' : err?.message || 'Verification failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, requestOtp, verifyOtp }
}
