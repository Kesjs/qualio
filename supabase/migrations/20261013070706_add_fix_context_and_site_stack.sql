-- Add the structured correction context used by the dashboard and fix prompt.
-- The migration is additive so existing scans and incidents remain readable.
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS fix_context JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.issues
  DROP CONSTRAINT IF EXISTS issues_fix_context_object_check;

ALTER TABLE public.issues
  ADD CONSTRAINT issues_fix_context_object_check
  CHECK (jsonb_typeof(fix_context) = 'object');

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS stack_type TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS repository_provider TEXT NOT NULL DEFAULT 'none';

UPDATE public.sites
SET stack_type = 'unknown'
WHERE stack_type IS NULL
   OR stack_type NOT IN ('nextjs', 'react_vite', 'shopify', 'webflow', 'wordpress', 'unknown');

UPDATE public.sites
SET repository_provider = 'none'
WHERE repository_provider IS NULL
   OR repository_provider NOT IN ('github', 'gitlab', 'bitbucket', 'none');

ALTER TABLE public.sites
  DROP CONSTRAINT IF EXISTS sites_stack_type_check,
  DROP CONSTRAINT IF EXISTS sites_repository_provider_check;

ALTER TABLE public.sites
  ADD CONSTRAINT sites_stack_type_check
    CHECK (stack_type IN ('nextjs', 'react_vite', 'shopify', 'webflow', 'wordpress', 'unknown')),
  ADD CONSTRAINT sites_repository_provider_check
    CHECK (repository_provider IN ('github', 'gitlab', 'bitbucket', 'none'));

COMMENT ON COLUMN public.issues.fix_context IS
  'Observed and inferred context used to build a deterministic correction prompt.';
COMMENT ON COLUMN public.sites.stack_type IS
  'User-declared stack hint. Qualio does not inspect the source repository.';
COMMENT ON COLUMN public.sites.repository_provider IS
  'User-declared repository provider. No repository credential or source access is implied.';
