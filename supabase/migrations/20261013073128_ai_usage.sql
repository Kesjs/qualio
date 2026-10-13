-- Bounded asynchronous classification budget per project and UTC month.
CREATE TABLE IF NOT EXISTS public.feedback_ai_usage (
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  classification_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (site_id, month_key)
);

ALTER TABLE public.feedback_ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feedback_ai_usage FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS feedback_ai_usage_user_month_idx
  ON public.feedback_ai_usage (user_id, month_key);

