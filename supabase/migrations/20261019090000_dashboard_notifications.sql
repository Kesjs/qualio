CREATE TABLE IF NOT EXISTS public.dashboard_notifications (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('alert', 'recommendation', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  dedupe_key TEXT NOT NULL UNIQUE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dashboard_notifications_user_created_idx
  ON public.dashboard_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dashboard_notifications_unread_idx
  ON public.dashboard_notifications (user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE public.dashboard_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY dashboard_notifications_select_own ON public.dashboard_notifications
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY dashboard_notifications_update_own ON public.dashboard_notifications
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
REVOKE INSERT, DELETE ON public.dashboard_notifications FROM anon, authenticated;
