-- 1. RLS : (select auth.uid()) évalué une seule fois par requête, et rôle authenticated explicite.
DROP POLICY IF EXISTS "Users can manage their own sites" ON public.sites;
CREATE POLICY "Users can manage their own sites"
  ON public.sites FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS notification_preferences_select_own ON public.notification_preferences;
CREATE POLICY notification_preferences_select_own
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notification_preferences_insert_own ON public.notification_preferences;
CREATE POLICY notification_preferences_insert_own
  ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notification_preferences_update_own ON public.notification_preferences;
CREATE POLICY notification_preferences_update_own
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 2. Index sur les clés étrangères non couvertes.
CREATE INDEX IF NOT EXISTS sites_user_id_idx
  ON public.sites (user_id);
CREATE INDEX IF NOT EXISTS collection_sources_user_id_idx
  ON public.collection_sources (user_id);
CREATE INDEX IF NOT EXISTS feedback_intake_events_site_id_idx
  ON public.feedback_intake_events (site_id);
CREATE INDEX IF NOT EXISTS feedback_recommendations_synthesis_id_idx
  ON public.feedback_recommendations (synthesis_id);
