-- À exécuter manuellement avec la clé de service pour prolonger un testeur.
-- Remplacer l’email ; ne pas exécuter depuis l’application.
DO $$
DECLARE target_user UUID;
BEGIN
  SELECT id INTO target_user FROM auth.users WHERE email = 'TESTEUR@example.com';
  IF target_user IS NULL THEN RAISE EXCEPTION 'Utilisateur introuvable'; END IF;
  INSERT INTO public.billing_subscriptions (user_id, stripe_customer_id, plan, status, source, current_period_end)
  VALUES (target_user, 'manual_' || target_user::text, 'pro', 'active', 'manual', now() + interval '30 days')
  ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = excluded.stripe_customer_id, plan = 'pro', status = 'active', source = 'manual', current_period_end = excluded.current_period_end, trial_ends_at = NULL, updated_at = now();
END $$;
