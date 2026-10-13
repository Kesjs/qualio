-- A site may have at most one scan waiting for or using a worker.
-- The API also checks this condition for a friendly response; this index
-- closes the race between two simultaneous start requests.
create unique index if not exists scans_one_active_per_site_idx
  on public.scans (site_id)
  where status in ('queued', 'running', 'discovering', 'crawling', 'browser_testing', 'analyzing', 'reporting');
