-- Migration : Ajout du plan 'agency' (Agence à 49 $ / mois)
-- Permet aux utilisateurs de souscrire au plan Agence (15 projets, 10 000 avis/projet).

ALTER TABLE public.billing_subscriptions
  DROP CONSTRAINT IF EXISTS billing_subscriptions_plan_check;

ALTER TABLE public.billing_subscriptions
  ADD CONSTRAINT billing_subscriptions_plan_check
    CHECK (plan IN ('free', 'pro', 'agency'));

COMMENT ON CONSTRAINT billing_subscriptions_plan_check ON public.billing_subscriptions IS
  'Plans autorisés : free (gratuit), pro (19 $/mois) et agency (49 $/mois).';
