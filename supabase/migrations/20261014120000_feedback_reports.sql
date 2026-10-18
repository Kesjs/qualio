-- Rapports partageables (plan Agence) : lien à jeton, révocable. Accès uniquement par le serveur (service role).
CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS feedback_reports_site_idx ON public.feedback_reports (site_id) WHERE revoked_at IS NULL;

ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feedback_reports FROM anon, authenticated;
