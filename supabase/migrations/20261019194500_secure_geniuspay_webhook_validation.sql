CREATE TABLE IF NOT EXISTS public.geniuspay_payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_reference TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'agency')),
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  provider_reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geniuspay_payment_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.geniuspay_payment_intents FROM anon, authenticated;
