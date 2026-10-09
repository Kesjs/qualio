-- Public collection source for the Qualio widget.
-- The key identifies a project but never grants dashboard access.

CREATE TABLE IF NOT EXISTS public.collection_sources (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('widget')),
  public_key TEXT NOT NULL UNIQUE CHECK (char_length(public_key) >= 24),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS collection_sources_site_type_idx
  ON public.collection_sources (site_id, type);

ALTER TABLE public.collection_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own collection sources" ON public.collection_sources;
CREATE POLICY "Users can manage their own collection sources"
  ON public.collection_sources FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.sites WHERE sites.id = collection_sources.site_id AND sites.user_id = (SELECT auth.uid()))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_sources TO authenticated;
