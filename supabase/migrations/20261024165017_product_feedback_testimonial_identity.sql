-- Identité que l'utilisateur souhaite afficher si son retour devient un témoignage.
ALTER TABLE public.product_feedback
  ADD COLUMN IF NOT EXISTS testimonial_name text,
  ADD COLUMN IF NOT EXISTS testimonial_role text;

ALTER TABLE public.product_feedback
  ADD CONSTRAINT product_feedback_testimonial_name_length CHECK (testimonial_name IS NULL OR char_length(testimonial_name) BETWEEN 1 AND 80),
  ADD CONSTRAINT product_feedback_testimonial_role_length CHECK (testimonial_role IS NULL OR char_length(testimonial_role) BETWEEN 1 AND 120);
