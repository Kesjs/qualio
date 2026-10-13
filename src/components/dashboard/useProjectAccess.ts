'use client'

import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { useBillingStatus } from './useBillingStatus'

export const READ_ONLY_TEXT = 'Ce projet est en lecture seule : votre plan Gratuit inclut 1 projet actif. Passez à Pro pour le réactiver.'

/**
 * Plan, usage et droits du projet actif, en un seul endroit.
 * `blockReason` non vide = toute action d'ajout est grisée et la raison est affichée (doc 2.4).
 */
export function useProjectAccess() {
  const { activeSite, isLoading: sitesLoading } = useActiveSite()
  const { data: billing, isLoading: billingLoading, refetch } = useBillingStatus(activeSite?.id)

  const plan = billing?.plan ?? 'free'
  const isFree = plan !== 'pro'
  const site = billing?.site ?? null
  const readOnly = Boolean(activeSite && billing?.writableSiteIds && !billing.writableSiteIds.includes(activeSite.id))
  const limitReached = Boolean(site && site.feedbackLimit > 0 && site.feedback >= site.feedbackLimit)

  const blockReason = readOnly
    ? READ_ONLY_TEXT
    : limitReached && site
      ? `Vous avez atteint ${site.feedbackLimit} avis. ${isFree ? 'Passez à Pro pour en ajouter.' : 'Archivez des avis pour en ajouter.'} Vos anciens avis restent visibles.`
      : null

  return {
    activeSite,
    billing,
    plan,
    isFree,
    site,
    readOnly,
    limitReached,
    blockReason,
    canAdd: Boolean(activeSite) && !blockReason,
    isLoading: sitesLoading || billingLoading,
    refetchBilling: refetch,
  }
}
