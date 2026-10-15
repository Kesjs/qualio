-- À exécuter à la main dans l'éditeur SQL de Supabase (clé de service), jamais depuis l'application.
-- Met un compte de test sur le plan voulu pour 30 jours, sans passer par Stripe.
-- 1) Remplace l'email et le plan ('free', 'pro' ou 'agency'). 2) Exécute.
-- Limite : ce compte est « manuel », donc le webhook Stripe ne tourne pas. Le bloc final débloque les avis
-- en attente à la main (ils ne seront pas classés par thème, c'est normal pour un test).
DO $$
DECLARE
  target_user UUID;
  target_plan TEXT := 'agency';             -- 'free' | 'pro' | 'agency'
BEGIN
  SELECT id INTO target_user FROM auth.users WHERE email = 'TESTEUR@example.com';
  IF target_user IS NULL THEN RAISE EXCEPTION 'Utilisateur introuvable'; END IF;
  IF target_plan NOT IN ('free', 'pro', 'agency') THEN RAISE EXCEPTION 'Plan invalide'; END IF;

  INSERT INTO public.billing_subscriptions (user_id, stripe_customer_id, plan, status, source, current_period_end)
  VALUES (target_user, 'manual_' || target_user::text, target_plan, CASE WHEN target_plan = 'free' THEN 'free' ELSE 'active' END, 'manual', now() + interval '30 days')
  ON CONFLICT (user_id) DO UPDATE SET plan = excluded.plan, status = excluded.status, source = 'manual', current_period_end = excluded.current_period_end, updated_at = now();

  -- Optionnel : débloquer les avis en attente d'un compte passé à Pro ou Agence.
  IF target_plan <> 'free' THEN
    UPDATE public.feedback_items SET status = 'open' WHERE user_id = target_user AND status = 'locked';
  END IF;
END $$;
