CREATE TABLE IF NOT EXISTS public.github_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installation_id BIGINT NOT NULL UNIQUE,
  account_login TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'User',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.github_installations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their GitHub installations" ON public.github_installations;
CREATE POLICY "Users manage their GitHub installations"
  ON public.github_installations FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS github_installation_id BIGINT,
  ADD COLUMN IF NOT EXISTS github_owner TEXT,
  ADD COLUMN IF NOT EXISTS github_repo TEXT,
  ADD COLUMN IF NOT EXISTS github_default_branch TEXT;

CREATE TABLE IF NOT EXISTS public.github_pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  number INTEGER,
  url TEXT,
  branch TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.github_pull_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their GitHub pull requests" ON public.github_pull_requests;
CREATE POLICY "Users manage their GitHub pull requests"
  ON public.github_pull_requests FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS github_installations_user_idx ON public.github_installations(user_id);
CREATE INDEX IF NOT EXISTS github_pull_requests_issue_idx ON public.github_pull_requests(issue_id);
