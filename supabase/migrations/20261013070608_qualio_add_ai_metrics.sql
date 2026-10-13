-- Add AI tracking fields to scans to track overall run cost
ALTER TABLE public.scans
  ADD COLUMN ai_calls_count INT DEFAULT 0,
  ADD COLUMN ai_tokens_input INT DEFAULT 0,
  ADD COLUMN ai_tokens_output INT DEFAULT 0,
  ADD COLUMN ai_cost_usd NUMERIC(10, 6) DEFAULT 0,
  ADD COLUMN ai_duration_ms INT DEFAULT 0;

-- Add AI tracking fields to issues to track individual diagnosis cost
ALTER TABLE public.issues
  ADD COLUMN ai_tokens_input INT DEFAULT 0,
  ADD COLUMN ai_tokens_output INT DEFAULT 0,
  ADD COLUMN ai_cost_usd NUMERIC(10, 6) DEFAULT 0,
  ADD COLUMN ai_duration_ms INT DEFAULT 0,
  ADD COLUMN ai_model TEXT DEFAULT 'gpt-5.6-luna';
