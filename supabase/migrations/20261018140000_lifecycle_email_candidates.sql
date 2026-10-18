-- Relances de cycle de vie : sélection des destinataires côté base.
-- Remplace la lecture de 1 000 utilisateurs puis 4 requêtes par utilisateur dans le cron :
-- une seule requête par étape, déjà filtrée par consentement, fenêtre de dates et envois passés.
--
-- Fenêtre p_min_days / p_max_days :
--   activation_nudge, project_nudge, feedback_request : âge du compte (inscription)
--   decision_reminder                                  : âge de la dernière synthèse
CREATE OR REPLACE FUNCTION public.lifecycle_email_candidates(
  p_stage text,
  p_min_days integer,
  p_max_days integer,
  p_limit integer DEFAULT 200
)
RETURNS TABLE (candidate_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_stage NOT IN ('activation_nudge', 'project_nudge', 'feedback_request', 'decision_reminder') THEN
    RAISE EXCEPTION 'Étape de relance inconnue : %', p_stage;
  END IF;

  IF p_stage = 'decision_reminder' THEN
    RETURN QUERY
    SELECT u.id
    FROM auth.users u
    JOIN public.notification_preferences np ON np.user_id = u.id
    JOIN LATERAL (
      SELECT s.created_at, s.recommendations
      FROM public.feedback_syntheses s
      WHERE s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 1
    ) last_synthesis ON true
    WHERE u.email IS NOT NULL
      AND u.deleted_at IS NULL
      AND np.weekly_digest
      AND np.consented_at IS NOT NULL
      AND np.unsubscribed_at IS NULL
      AND last_synthesis.created_at <= now() - make_interval(days => p_min_days)
      AND last_synthesis.created_at > now() - make_interval(days => p_max_days)
      AND jsonb_array_length(last_synthesis.recommendations) > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.feedback_recommendations r
        WHERE r.user_id = u.id AND r.status IN ('accepted', 'dismissed', 'done')
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.email_log el
        WHERE el.user_id = u.id AND el.event_type = p_stage
      )
    ORDER BY last_synthesis.created_at
    LIMIT p_limit;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.id
  FROM auth.users u
  JOIN public.notification_preferences np ON np.user_id = u.id
  WHERE u.email IS NOT NULL
    AND u.deleted_at IS NULL
    AND np.weekly_digest
    AND np.consented_at IS NOT NULL
    AND np.unsubscribed_at IS NULL
    AND u.created_at <= now() - make_interval(days => p_min_days)
    AND u.created_at > now() - make_interval(days => p_max_days)
    AND NOT EXISTS (
      SELECT 1 FROM public.email_log el
      WHERE el.user_id = u.id AND el.event_type = p_stage
    )
    AND CASE p_stage
      WHEN 'activation_nudge' THEN
        NOT EXISTS (SELECT 1 FROM public.sites s WHERE s.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM public.product_events pe WHERE pe.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM public.product_feedback pf WHERE pf.user_id = u.id)
      WHEN 'project_nudge' THEN
        EXISTS (SELECT 1 FROM public.sites s WHERE s.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM public.feedback_items fi WHERE fi.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM public.product_feedback pf WHERE pf.user_id = u.id)
      ELSE -- feedback_request
        EXISTS (SELECT 1 FROM public.product_events pe WHERE pe.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM public.product_feedback pf WHERE pf.user_id = u.id)
    END
  ORDER BY u.created_at
  LIMIT p_limit;
END;
$$;

-- Réservée au service role : la fonction lit auth.users.
REVOKE ALL ON FUNCTION public.lifecycle_email_candidates(text, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lifecycle_email_candidates(text, integer, integer, integer) TO service_role;
