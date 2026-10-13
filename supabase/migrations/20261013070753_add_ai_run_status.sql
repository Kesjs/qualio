ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS ai_status TEXT NOT NULL DEFAULT 'not_needed',
  ADD COLUMN IF NOT EXISTS ai_error TEXT;

ALTER TABLE public.scans
  DROP CONSTRAINT IF EXISTS scans_ai_status_check;

ALTER TABLE public.scans
  ADD CONSTRAINT scans_ai_status_check
  CHECK (ai_status IN ('not_needed', 'success', 'failed'));
