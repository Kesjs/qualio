ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS scan_modules JSONB NOT NULL DEFAULT '["pages", "cta", "forms", "consoleErrors", "mobileResponsive"]'::jsonb,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS worker_started_at TIMESTAMPTZ;

ALTER TABLE public.scans
  DROP CONSTRAINT IF EXISTS scans_attempt_count_check,
  DROP CONSTRAINT IF EXISTS scans_max_attempts_check;

ALTER TABLE public.scans
  ADD CONSTRAINT scans_attempt_count_check CHECK (attempt_count >= 0),
  ADD CONSTRAINT scans_max_attempts_check CHECK (max_attempts >= 1);

CREATE INDEX IF NOT EXISTS scans_queue_idx
  ON public.scans (status, queued_at)
  WHERE status IN ('queued', 'running', 'discovering', 'crawling', 'browser_testing', 'analyzing', 'reporting');

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS journey_definitions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.sites
  DROP CONSTRAINT IF EXISTS sites_journey_definitions_array_check;

ALTER TABLE public.sites
  ADD CONSTRAINT sites_journey_definitions_array_check
  CHECK (jsonb_typeof(journey_definitions) = 'array');
