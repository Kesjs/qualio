-- À exécuter manuellement avec la clé de service.
DO $$
DECLARE target_user UUID;
BEGIN
  SELECT id INTO target_user FROM auth.users WHERE email = 'TESTEUR@example.com';
  IF target_user IS NULL THEN RAISE EXCEPTION 'Utilisateur introuvable'; END IF;
  UPDATE public.billing_subscriptions SET plan = 'free', status = 'free', source = 'manual', current_period_end = now(), updated_at = now() WHERE user_id = target_user;
END $$;
