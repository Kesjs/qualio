-- Secteur du projet (doc 3.6 : Projet = nom, secteur, suppression).
-- Liste fermée côté application : Produit / SaaS, Agence ou freelance, Boutique en ligne, Autre.
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS sector text
  CHECK (sector IS NULL OR char_length(sector) <= 80);
