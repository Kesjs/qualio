-- Reconcile the production schema with the dashboard/API contract.
-- This migration is intentionally additive and safe to run on an existing database.

-- The dashboard and scan history expose the deployment environment.
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'production';

UPDATE public.sites
SET environment = 'production'
WHERE environment IS NULL OR environment NOT IN ('production', 'staging');

ALTER TABLE public.sites
  DROP CONSTRAINT IF EXISTS sites_environment_check;

ALTER TABLE public.sites
  ADD CONSTRAINT sites_environment_check
  CHECK (environment IN ('production', 'staging'));

-- The application already expects a profile record for plan/quota settings.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  scans_count INTEGER NOT NULL DEFAULT 0,
  max_scans INTEGER NOT NULL DEFAULT 5,
  staging_header TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Keep journey step access explicit and compatible with current Supabase policy syntax.
DROP POLICY IF EXISTS "Users can view their own journey steps" ON public.journey_steps;
CREATE POLICY "Users can view their own journey steps"
  ON public.journey_steps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.scans
      WHERE scans.id = journey_steps.scan_id
        AND scans.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role can manage journey steps" ON public.journey_steps;
CREATE POLICY "Service role can manage journey steps"
  ON public.journey_steps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
