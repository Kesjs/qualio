ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS onboarding_method TEXT;

ALTER TABLE public.sites
  DROP CONSTRAINT IF EXISTS sites_onboarding_method_check;

ALTER TABLE public.sites
  ADD CONSTRAINT sites_onboarding_method_check
  CHECK (onboarding_method IS NULL OR onboarding_method IN ('widget', 'import'));

COMMENT ON COLUMN public.sites.onboarding_method IS
  'Primary feedback collection method selected during onboarding.';
