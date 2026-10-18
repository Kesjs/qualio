-- Feedback produit envoyé par les premiers utilisateurs de Qualio.
-- Les retours restent privés par défaut et ne deviennent jamais un témoignage public sans consentement.
CREATE TABLE IF NOT EXISTS public.product_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('improvement', 'bug', 'difficulty', 'positive', 'other')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 4000),
  context text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'planned', 'done', 'declined', 'archived')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  allow_contact boolean NOT NULL DEFAULT false,
  allow_public_testimonial boolean NOT NULL DEFAULT false,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_feedback_insert_own ON public.product_feedback;
CREATE POLICY product_feedback_insert_own ON public.product_feedback
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS product_feedback_select_own ON public.product_feedback;
CREATE POLICY product_feedback_select_own ON public.product_feedback
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS product_feedback_user_created_idx
  ON public.product_feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS product_feedback_status_priority_idx
  ON public.product_feedback (status, priority, created_at DESC);

DROP TRIGGER IF EXISTS product_feedback_set_updated_at ON public.product_feedback;
CREATE TRIGGER product_feedback_set_updated_at
  BEFORE UPDATE ON public.product_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE UPDATE, DELETE ON public.product_feedback FROM anon, authenticated;
