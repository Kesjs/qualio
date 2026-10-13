-- Feedback-only indexes and guardrails. Existing rows are not rewritten.

CREATE INDEX IF NOT EXISTS feedback_items_site_created_idx
  ON public.feedback_items (site_id, created_at DESC);

CREATE INDEX IF NOT EXISTS feedback_items_site_status_idx
  ON public.feedback_items (site_id, status);

CREATE INDEX IF NOT EXISTS feedback_syntheses_site_created_idx
  ON public.feedback_syntheses (site_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS collection_sources_public_key_unique_idx
  ON public.collection_sources (public_key)
  WHERE public_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.feedback_intake_events (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  public_key TEXT NOT NULL,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feedback_intake_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feedback_intake_events FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS feedback_intake_events_ip_created_idx
  ON public.feedback_intake_events (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_intake_events_key_created_idx
  ON public.feedback_intake_events (public_key, created_at DESC);

-- Keep the authenticated surface scoped to both the user and their project.
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_items;
CREATE POLICY "Users can view their own feedback"
  ON public.feedback_items FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_items.site_id AND sites.user_id = (SELECT auth.uid()))
  );
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
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_items.site_id AND sites.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_items.site_id AND sites.user_id = (SELECT auth.uid()))
  );
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.feedback_items;
CREATE POLICY "Users can delete their own feedback"
  ON public.feedback_items FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_items.site_id AND sites.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can manage their own feedback syntheses" ON public.feedback_syntheses;
CREATE POLICY "Users can manage their own feedback syntheses"
  ON public.feedback_syntheses FOR ALL TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_syntheses.site_id AND sites.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_syntheses.site_id AND sites.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can manage their own feedback recommendations" ON public.feedback_recommendations;
CREATE POLICY "Users can manage their own feedback recommendations"
  ON public.feedback_recommendations FOR ALL TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_recommendations.site_id AND sites.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = feedback_recommendations.site_id AND sites.user_id = (SELECT auth.uid()))
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feedback_items_content_length_check'
      AND conrelid = 'public.feedback_items'::regclass
  ) THEN
    ALTER TABLE public.feedback_items
      ADD CONSTRAINT feedback_items_content_length_check
      CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feedback_items_status_check'
      AND conrelid = 'public.feedback_items'::regclass
  ) THEN
    ALTER TABLE public.feedback_items
      ADD CONSTRAINT feedback_items_status_check
      CHECK (status IN ('open', 'reviewed', 'archived')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feedback_items_sentiment_check'
      AND conrelid = 'public.feedback_items'::regclass
  ) THEN
    ALTER TABLE public.feedback_items
      ADD CONSTRAINT feedback_items_sentiment_check
      CHECK (sentiment IS NULL OR sentiment IN ('positive', 'neutral', 'negative')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feedback_items_source_check'
      AND conrelid = 'public.feedback_items'::regclass
  ) THEN
    ALTER TABLE public.feedback_items
      ADD CONSTRAINT feedback_items_source_check
      CHECK (source IN ('manual', 'widget', 'csv')) NOT VALID;
  END IF;
END $$;
