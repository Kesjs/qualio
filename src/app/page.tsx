import { Suspense } from 'react'
import { AuthCodeRedirect } from '@/components/auth/AuthCodeRedirect'
import { LightLanding } from '@/components/landing/LightLanding'

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthCodeRedirect />
      </Suspense>
      <LightLanding />
    </>
  )
}
