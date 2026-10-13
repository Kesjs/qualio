ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS journey_scope TEXT NOT NULL DEFAULT 'all';

ALTER TABLE public.scans
  DROP CONSTRAINT IF EXISTS scans_journey_scope_check;

ALTER TABLE public.scans
  ADD CONSTRAINT scans_journey_scope_check
  CHECK (journey_scope IN ('all', 'p0'));
