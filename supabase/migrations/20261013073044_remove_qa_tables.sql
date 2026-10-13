-- Qualio Feedback-only cleanup.
-- Counts observed in the production audit (2026-10-11):
-- scans=2, pages=38, checks=93, issues=1, evidence=2, screenshots=1,
-- journey_steps=0, deployment_events=0, site_secrets=0,
-- github_installations=0, github_pull_requests=0.
-- This migration is intentionally additive: it does not edit an old migration.

-- Children of scans first.
DROP TABLE IF EXISTS public.journey_steps;
DROP TABLE IF EXISTS public.screenshots;
DROP TABLE IF EXISTS public.evidence;

-- Pull requests reference issues, so they must be removed before issues.
DROP TABLE IF EXISTS public.github_pull_requests;

DROP TABLE IF EXISTS public.issues;
DROP TABLE IF EXISTS public.checks;
DROP TABLE IF EXISTS public.pages;

-- Integrations and deployment records.
DROP TABLE IF EXISTS public.github_installations;
DROP TABLE IF EXISTS public.deployment_events;
DROP TABLE IF EXISTS public.site_secrets;

-- sites.last_scan_id references scans. CASCADE is deliberate here because
-- cleanup_sites_columns.sql removes that orphaned column immediately after.
DROP TABLE IF EXISTS public.scans CASCADE;

-- The private Storage bucket screenshots still contains 3 objects (26,825
-- bytes). SQL does not delete Storage objects safely. Decide and execute that
-- removal separately with a reviewed Storage operation before deleting the
-- bucket; no bucket deletion is performed by this migration.
