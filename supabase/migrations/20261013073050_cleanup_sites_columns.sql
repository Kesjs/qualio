-- Remove columns that only belonged to the retired QA product.
-- The Feedback product does not require a URL, so url becomes nullable.

ALTER TABLE public.sites
  ALTER COLUMN url DROP NOT NULL;

ALTER TABLE public.sites
  DROP COLUMN IF EXISTS last_scan_id,
  DROP COLUMN IF EXISTS journey_definitions,
  DROP COLUMN IF EXISTS environment,
  DROP COLUMN IF EXISTS stack_type,
  DROP COLUMN IF EXISTS repository_provider,
  DROP COLUMN IF EXISTS github_installation_id,
  DROP COLUMN IF EXISTS github_owner,
  DROP COLUMN IF EXISTS github_repo,
  DROP COLUMN IF EXISTS github_default_branch,
  DROP COLUMN IF EXISTS deployment_scan_mode,
  DROP COLUMN IF EXISTS deployment_webhook_token_hash,
  DROP COLUMN IF EXISTS deployment_webhook_created_at,
  DROP COLUMN IF EXISTS last_deployment_event_at,
  DROP COLUMN IF EXISTS last_deployment_commit_sha,
  DROP COLUMN IF EXISTS last_deployment_url,
  DROP COLUMN IF EXISTS monitor_enabled,
  DROP COLUMN IF EXISTS monitor_frequency_hours,
  DROP COLUMN IF EXISTS monitor_next_run_at,
  DROP COLUMN IF EXISTS monitor_last_run_at,
  DROP COLUMN IF EXISTS monitor_target_url,
  DROP COLUMN IF EXISTS monitor_target_kind;

