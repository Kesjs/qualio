-- Suppression de l'essai Pro de 14 jours (doc de lancement, 2.3 : le Gratuit joue le rôle d'essai).
-- Un utilisateur sans ligne dans billing_subscriptions est au plan Gratuit.

-- 1. Les essais Qualio n'ont jamais eu d'abonnement Stripe : ces lignes ne servent plus à rien.
--    Un essai converti en abonnement payant a déjà été réécrit par le webhook en source 'stripe'.
DELETE FROM public.billing_subscriptions
WHERE source = 'trial' AND stripe_subscription_id IS NULL;

-- 2. Par sécurité, une éventuelle ligne 'trial' restante repasse en source Stripe.
UPDATE public.billing_subscriptions SET source = 'stripe' WHERE source = 'trial';

DROP INDEX IF EXISTS public.billing_subscriptions_trial_expiry_idx;

ALTER TABLE public.billing_subscriptions
  DROP CONSTRAINT IF EXISTS billing_subscriptions_source_check;

ALTER TABLE public.billing_subscriptions
  ADD CONSTRAINT billing_subscriptions_source_check
    CHECK (source IN ('stripe', 'manual'));

ALTER TABLE public.billing_subscriptions
  DROP COLUMN IF EXISTS trial_ends_at;
