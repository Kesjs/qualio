-- Migration: Création de la table journey_steps pour les user journeys
-- Description: Stocke chaque étape d'un parcours utilisateur exécuté par Playwright

-- Table principale : journey_steps
CREATE TABLE IF NOT EXISTS public.journey_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
  
  -- Identification de l'étape
  journey_name TEXT NOT NULL, -- Ex: "Lead & Demo Conversion Flow"
  step_order INTEGER NOT NULL, -- Position dans le parcours (1, 2, 3...)
  step_name TEXT NOT NULL, -- Ex: "Homepage", "Click CTA", "Submit form"
  
  -- Action effectuée
  action_type TEXT NOT NULL, -- 'navigate', 'click', 'fill', 'submit', 'wait', 'assert'
  action_target TEXT, -- Ex: "#pricing-link", "form#contact"
  action_details JSONB, -- Détails additionnels (champs remplis, URL navigée, etc.)
  
  -- Résultat de l'étape
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'not_reached', 'skip')),
  result_payload JSONB, -- HTTP status, network errors, console errors, etc.
  error_message TEXT, -- Message d'erreur si échec
  
  -- Screenshot (capturé uniquement en cas d'échec)
  screenshot_id UUID REFERENCES public.screenshots(id) ON DELETE SET NULL,
  
  -- Métadonnées
  duration_ms INTEGER, -- Temps d'exécution de l'étape
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index pour les requêtes fréquentes
  CONSTRAINT journey_steps_scan_step_unique UNIQUE (scan_id, journey_name, step_order)
);

-- Index pour améliorer les performances
CREATE INDEX idx_journey_steps_scan_id ON public.journey_steps(scan_id);
CREATE INDEX idx_journey_steps_issue_id ON public.journey_steps(issue_id) WHERE issue_id IS NOT NULL;
CREATE INDEX idx_journey_steps_status ON public.journey_steps(status);
CREATE INDEX idx_journey_steps_journey_name ON public.journey_steps(journey_name);

-- RLS (Row Level Security)
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir les journey_steps de leurs propres scans
CREATE POLICY "Users can view their own journey steps"
  ON public.journey_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = journey_steps.scan_id
      AND scans.user_id = auth.uid()
    )
  );

-- Politique : Le service peut insérer/modifier les journey_steps
CREATE POLICY "Service role can manage journey steps"
  ON public.journey_steps
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Commentaires pour documentation
COMMENT ON TABLE public.journey_steps IS 'Stocke chaque étape d''un parcours utilisateur (user journey) exécuté par Playwright pendant un scan';
COMMENT ON COLUMN public.journey_steps.journey_name IS 'Nom du parcours complet (ex: "Lead & Demo Conversion Flow")';
COMMENT ON COLUMN public.journey_steps.step_order IS 'Position de l''étape dans le parcours (commence à 1)';
COMMENT ON COLUMN public.journey_steps.step_name IS 'Nom descriptif de l''étape (ex: "Homepage", "Click CTA")';
COMMENT ON COLUMN public.journey_steps.action_type IS 'Type d''action Playwright : navigate, click, fill, submit, wait, assert';
COMMENT ON COLUMN public.journey_steps.status IS 'Résultat de l''étape : pass (réussi), fail (échec), not_reached (étape suivante non atteinte après échec), skip (ignorée)';
COMMENT ON COLUMN public.journey_steps.screenshot_id IS 'Screenshot capturé à cette étape (uniquement si échec)';
COMMENT ON COLUMN public.journey_steps.result_payload IS 'Données techniques : HTTP status, network errors, console logs, DOM state, etc.';
