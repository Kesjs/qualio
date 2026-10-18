-- Avis reçus au-delà de la limite du plan : conservés mais non analysés (statut « locked »).
-- Ils sont débloqués automatiquement quand le compte passe à un plan payant.
ALTER TABLE public.feedback_items DROP CONSTRAINT IF EXISTS feedback_items_status_check;
ALTER TABLE public.feedback_items
  ADD CONSTRAINT feedback_items_status_check
  CHECK (status IN ('open', 'reviewed', 'archived', 'locked'));
