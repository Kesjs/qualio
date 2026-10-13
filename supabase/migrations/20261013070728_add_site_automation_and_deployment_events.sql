-- Event-driven deployment notifications and automatic verification settings.
-- The webhook only queues a Qualio re-scan; it never writes to the customer's site.

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS deployment_scan_mode TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS deployment_webhook_token_hash TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS deployment_webhook_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_deployment_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_deployment_commit_sha TEXT,
  ADD COLUMN IF NOT EXISTS last_deployment_url TEXT;

ALTER TABLE public.sites
  DROP CONSTRAINT IF EXISTS sites_deployment_scan_mode_check;

ALTER TABLE public.sites
  ADD CONSTRAINT sites_deployment_scan_mode_check
  CHECK (deployment_scan_mode IN ('manual', 'automatic'));

CREATE TABLE IF NOT EXISTS public.deployment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'webhook',
  status TEXT NOT NULL DEFAULT 'succeeded',
  environment TEXT,
  commit_sha TEXT,
  deployment_url TEXT,
  scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_event_id)
);

ALTER TABLE public.deployment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own deployment events" ON public.deployment_events;
CREATE POLICY "Users can view their own deployment events"
  ON public.deployment_events FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS deployment_events_site_created_idx
  ON public.deployment_events(site_id, created_at DESC);
