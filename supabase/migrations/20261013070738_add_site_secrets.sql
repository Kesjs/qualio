CREATE TABLE IF NOT EXISTS public.site_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, name)
);

CREATE INDEX IF NOT EXISTS idx_site_secrets_site_id ON public.site_secrets(site_id);
ALTER TABLE public.site_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their site secret names" ON public.site_secrets;
CREATE POLICY "Users can view their site secret names"
  ON public.site_secrets FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create site secrets" ON public.site_secrets;
CREATE POLICY "Users can create site secrets"
  ON public.site_secrets FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update site secrets" ON public.site_secrets;
CREATE POLICY "Users can update site secrets"
  ON public.site_secrets FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete site secrets" ON public.site_secrets;
CREATE POLICY "Users can delete site secrets"
  ON public.site_secrets FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
