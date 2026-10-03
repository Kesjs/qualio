-- V1 monitor: one selected critical journey, replayed on a user-selected cadence.
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS monitor_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monitor_frequency_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS monitor_next_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS monitor_last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS monitor_target_url text,
  ADD COLUMN IF NOT EXISTS monitor_target_kind text;

ALTER TABLE public.sites
  DROP CONSTRAINT IF EXISTS sites_monitor_frequency_hours_check;

ALTER TABLE public.sites
  ADD CONSTRAINT sites_monitor_frequency_hours_check
  CHECK (monitor_frequency_hours IN (1, 6, 12, 24, 168));

CREATE INDEX IF NOT EXISTS sites_monitor_due_idx
  ON public.sites (monitor_next_run_at)
  WHERE monitor_enabled = true;
