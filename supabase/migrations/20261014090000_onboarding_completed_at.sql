-- Fin d'onboarding enregistrée côté serveur : l'étape se reprend sur n'importe quel appareil.
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.sites.onboarding_completed_at IS
  'Date de fin de l''onboarding du projet. NULL = onboarding à reprendre.';

-- Projets existants : ceux qui ont déjà choisi une méthode sont considérés comme terminés.
UPDATE public.sites
  SET onboarding_completed_at = COALESCE(updated_at, created_at, now())
  WHERE onboarding_method IS NOT NULL
    AND onboarding_completed_at IS NULL;
