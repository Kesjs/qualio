-- Stripe subscription state mirrored for server-side entitlements.
-- Stripe remains the payment source of truth; this table is the local access cache.

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'essential', 'pro')),
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused', 'canceled', 'incomplete_expired')),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_subscriptions_status_idx
  ON public.billing_subscriptions (status, plan);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own billing subscription" ON public.billing_subscriptions;
CREATE POLICY "Users can view their own billing subscription"
  ON public.billing_subscriptions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.billing_subscriptions TO authenticated;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;
