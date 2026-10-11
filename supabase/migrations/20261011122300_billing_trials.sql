-- Two billing plans only: free and pro. Remote audit found no existing
-- billing_subscriptions rows, so removing essential does not orphan a user.

ALTER TABLE public.billing_subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'stripe';

ALTER TABLE public.billing_subscriptions
  DROP CONSTRAINT IF EXISTS billing_subscriptions_plan_check,
  DROP CONSTRAINT IF EXISTS billing_subscriptions_source_check;

ALTER TABLE public.billing_subscriptions
  ADD CONSTRAINT billing_subscriptions_plan_check
    CHECK (plan IN ('free', 'pro')),
  ADD CONSTRAINT billing_subscriptions_source_check
    CHECK (source IN ('stripe', 'trial', 'manual'));

CREATE INDEX IF NOT EXISTS billing_subscriptions_trial_expiry_idx
  ON public.billing_subscriptions (trial_ends_at)
  WHERE source = 'trial' AND status = 'trialing';

