-- Persisted recommendations need enough structure to survive new syntheses.
ALTER TABLE public.feedback_recommendations
  ADD COLUMN IF NOT EXISTS synthesis_id uuid REFERENCES public.feedback_syntheses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS action text,
  ADD COLUMN IF NOT EXISTS rationale text,
  ADD COLUMN IF NOT EXISTS confidence text,
  ADD COLUMN IF NOT EXISTS uncertainty text,
  ADD COLUMN IF NOT EXISTS fingerprint text,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS done_at timestamptz,
  ADD COLUMN IF NOT EXISTS baseline_count integer;

UPDATE public.feedback_recommendations
SET status = 'open'
WHERE status NOT IN ('open', 'accepted', 'dismissed', 'done');

ALTER TABLE public.feedback_recommendations
  DROP CONSTRAINT IF EXISTS feedback_recommendations_status_check;

ALTER TABLE public.feedback_recommendations
  ADD CONSTRAINT feedback_recommendations_status_check
  CHECK (status IN ('open', 'accepted', 'dismissed', 'done'));

ALTER TABLE public.feedback_recommendations
  DROP CONSTRAINT IF EXISTS feedback_recommendations_priority_check;

ALTER TABLE public.feedback_recommendations
  ADD CONSTRAINT feedback_recommendations_priority_check
  CHECK (priority IS NULL OR priority IN ('high', 'medium', 'low'));

ALTER TABLE public.feedback_recommendations
  DROP CONSTRAINT IF EXISTS feedback_recommendations_confidence_check;

ALTER TABLE public.feedback_recommendations
  ADD CONSTRAINT feedback_recommendations_confidence_check
  CHECK (confidence IS NULL OR confidence IN ('high', 'medium', 'low'));

CREATE UNIQUE INDEX IF NOT EXISTS feedback_recommendations_site_fingerprint_idx
  ON public.feedback_recommendations (site_id, fingerprint)
  WHERE status <> 'dismissed' AND fingerprint IS NOT NULL;
