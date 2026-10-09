-- Feedback workspace foundation.
-- This migration is additive: it keeps the existing QA tables and gives the
-- redesigned dashboard its own persisted feedback/recommendation records.

CREATE TABLE IF NOT EXISTS public.feedback_items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'widget', 'public_link', 'csv')),
  content TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 10000),
  author_name TEXT,
  author_email TEXT,
  source_url TEXT,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewed', 'archived')),
  theme TEXT,
  sentiment TEXT CHECK (sentiment IS NULL OR sentiment IN ('positive', 'neutral', 'negative')),
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT feedback_items_external_id_unique UNIQUE (site_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS feedback_items_user_site_created_idx
  ON public.feedback_items (user_id, site_id, created_at DESC);

ALTER TABLE public.feedback_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_items;
CREATE POLICY "Users can view their own feedback"
  ON public.feedback_items FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback_items;
CREATE POLICY "Users can insert their own feedback"
  ON public.feedback_items FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_items.site_id AND sites.user_id = (SELECT auth.uid()))
  );
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback_items;
CREATE POLICY "Users can update their own feedback"
  ON public.feedback_items FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.feedback_items;
CREATE POLICY "Users can delete their own feedback"
  ON public.feedback_items FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.feedback_recommendations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 500),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'accepted', 'dismissed')),
  feedback_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS feedback_recommendations_user_site_status_idx
  ON public.feedback_recommendations (user_id, site_id, status, created_at DESC);

ALTER TABLE public.feedback_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own feedback recommendations" ON public.feedback_recommendations;
CREATE POLICY "Users can manage their own feedback recommendations"
  ON public.feedback_recommendations FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_recommendations.site_id AND sites.user_id = (SELECT auth.uid()))
  );

-- New public-schema tables are not automatically exposed by the Data API on
-- newer Supabase projects, so expose only the authenticated CRUD surface.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_recommendations TO authenticated;
