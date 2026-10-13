-- Auth abuse protection. This migration is intentionally additive and is not
-- applied automatically by the application.
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ip_address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT signup_attempts_pkey PRIMARY KEY (id)
);

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.signup_attempts FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS signup_attempts_ip_created_idx
  ON public.signup_attempts (ip_address, created_at);
