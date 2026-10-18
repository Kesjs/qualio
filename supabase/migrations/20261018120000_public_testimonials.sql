-- Témoignages publiés sur la landing : uniquement ceux que l'admin valide, à partir d'un retour dont l'auteur
-- a coché « témoignage public » (product_feedback.allow_public_testimonial).
-- Table séparée : un utilisateur ne peut jamais publier lui-même. Accès uniquement par le serveur (service role).
CREATE TABLE IF NOT EXISTS public.public_testimonials (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  feedback_id UUID NOT NULL UNIQUE REFERENCES public.product_feedback(id) ON DELETE CASCADE,
  quote TEXT NOT NULL CHECK (char_length(quote) BETWEEN 10 AND 600),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  role TEXT NOT NULL DEFAULT '' CHECK (char_length(role) <= 120),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.public_testimonials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.public_testimonials FROM anon, authenticated;
