-- Partage d'une tâche (recommandation) par lien : jeton long, révocable à tout moment.
-- Accès uniquement par le serveur (service role), comme feedback_reports.
CREATE TABLE IF NOT EXISTS public.recommendation_shares (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES public.feedback_recommendations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Un seul lien actif par recommandation.
CREATE UNIQUE INDEX IF NOT EXISTS recommendation_shares_active_idx
  ON public.recommendation_shares (recommendation_id) WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS recommendation_shares_user_idx ON public.recommendation_shares (user_id);
CREATE INDEX IF NOT EXISTS recommendation_shares_site_idx ON public.recommendation_shares (site_id);

ALTER TABLE public.recommendation_shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recommendation_shares FROM anon, authenticated;
