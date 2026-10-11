-- Weekly digest preference. Server-side delivery uses the service role;
-- clients can only access their own preference row through RLS.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_digest boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  consent_source text CHECK (consent_source IN ('signup', 'settings')),
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS notification_preferences_select_own ON public.notification_preferences;
CREATE POLICY notification_preferences_select_own
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_insert_own ON public.notification_preferences;
CREATE POLICY notification_preferences_insert_own
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_update_own ON public.notification_preferences;
CREATE POLICY notification_preferences_update_own
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
