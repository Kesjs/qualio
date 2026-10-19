-- 1) Budget de classification : réservation atomique (plus de dépassement quand plusieurs avis arrivent en même temps).
CREATE OR REPLACE FUNCTION public.reserve_classification_budget(p_site_id UUID, p_user_id UUID, p_month_key TEXT, p_max INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Une seule instruction : l'incrément ne s'applique que si le plafond n'est pas atteint.
  INSERT INTO public.feedback_ai_usage AS u (site_id, user_id, month_key, classification_count)
  VALUES (p_site_id, p_user_id, p_month_key, 1)
  ON CONFLICT (site_id, month_key) DO UPDATE
    SET classification_count = u.classification_count + 1, updated_at = NOW()
    WHERE u.classification_count < p_max
  RETURNING classification_count INTO v_count;
  RETURN v_count IS NOT NULL;
END;
$$;

-- Rend une unité de budget quand le fournisseur IA n'a rien renvoyé.
CREATE OR REPLACE FUNCTION public.release_classification_budget(p_site_id UUID, p_month_key TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.feedback_ai_usage
  SET classification_count = GREATEST(classification_count - 1, 0), updated_at = NOW()
  WHERE site_id = p_site_id AND month_key = p_month_key;
$$;

REVOKE ALL ON FUNCTION public.reserve_classification_budget(UUID, UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_classification_budget(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_classification_budget(UUID, UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_classification_budget(UUID, TEXT) TO service_role;

-- 2) Recommandations remplacées : une synthèse complète plus récente ne les reproduit plus.
ALTER TABLE public.feedback_recommendations
  DROP CONSTRAINT IF EXISTS feedback_recommendations_status_check;
ALTER TABLE public.feedback_recommendations
  ADD CONSTRAINT feedback_recommendations_status_check
  CHECK (status IN ('open', 'accepted', 'dismissed', 'done', 'superseded'));
