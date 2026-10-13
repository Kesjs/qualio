ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS monitor_triggered boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS scans_monitor_triggered_idx
  ON public.scans (monitor_triggered, created_at)
  WHERE monitor_triggered = true;
