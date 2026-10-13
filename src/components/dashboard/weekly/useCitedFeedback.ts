'use client'

import { useQuery } from '@tanstack/react-query'
import type { FeedbackItem } from '@/lib/feedback/types'

/** Les 3 premiers avis cités par une recommandation (doc 3.3). */
export function useCitedFeedback(siteId: string | undefined, ids: string[]) {
  const cited = ids.slice(0, 3)
  return useQuery({
    queryKey: ['cited-feedback', siteId, cited],
    enabled: Boolean(siteId) && cited.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const params = new URLSearchParams({ siteId: siteId!, status: 'all', ids: cited.join(',') })
      const response = await fetch(`/api/feedback/list?${params}`)
      if (!response.ok) throw new Error('Impossible de charger les avis cités.')
      const body = (await response.json()) as { items: FeedbackItem[] }
      return body.items
    },
  })
}
