-- Persisted AI syntheses for the feedback workspace.
-- The generated JSON keeps the evidence chain visible: every theme and
-- recommendation must reference feedback rows from the same project.

CREATE TABLE IF NOT EXISTS public.feedback_syntheses (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 500),
  summary TEXT NOT NULL CHECK (char_length(btrim(summary)) BETWEEN 1 AND 5000),
  feedback_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  themes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(themes) = 'array'),
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(recommendations) = 'array'),
  model TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd NUMERIC(12,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_syntheses_user_site_created_idx
  ON public.feedback_syntheses (user_id, site_id, created_at DESC);

ALTER TABLE public.feedback_syntheses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own feedback syntheses" ON public.feedback_syntheses;
CREATE POLICY "Users can manage their own feedback syntheses"
  ON public.feedback_syntheses FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_syntheses.site_id AND sites.user_id = (SELECT auth.uid()))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_syntheses TO authenticated;
