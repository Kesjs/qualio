import type { Json } from '@/lib/supabase/database.types'

export const SITE_STACK_TYPES = ['nextjs', 'react_vite', 'shopify', 'webflow', 'wordpress', 'unknown'] as const
export type SiteStackType = (typeof SITE_STACK_TYPES)[number]

export const REPOSITORY_PROVIDERS = ['github', 'gitlab', 'bitbucket', 'none'] as const
export type RepositoryProvider = (typeof REPOSITORY_PROVIDERS)[number]

export interface FixContext {
  expected: string
  actual: string
  repro_steps: string[]
  locate_hints: string[]
  acceptance_check: string
  page_url: string | null
  viewport: { name: string; width: number; height: number } | null
  selector: string | null
  visible_text: string | null
  uncertainties: string[]
}

export function isFixContext(value: unknown): value is FixContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const context = value as Partial<FixContext>
  return typeof context.expected === 'string'
    && typeof context.actual === 'string'
    && Array.isArray(context.repro_steps)
    && context.repro_steps.every((step) => typeof step === 'string')
    && Array.isArray(context.locate_hints)
    && context.locate_hints.every((hint) => typeof hint === 'string')
    && typeof context.acceptance_check === 'string'
    && Array.isArray(context.uncertainties)
    && context.uncertainties.every((item) => typeof item === 'string')
}

export function toFixContextJson(context: FixContext): Json {
  return context as unknown as Json
}
