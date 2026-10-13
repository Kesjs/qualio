-- Use `navigate` as the canonical navigation action before enforcing the app's
-- action vocabulary. Existing persisted rows remain valid after normalization.
UPDATE public.journey_steps
SET action_type = 'navigate'
WHERE action_type = 'navigation';

ALTER TABLE public.journey_steps
  DROP CONSTRAINT IF EXISTS journey_steps_action_type_check;

ALTER TABLE public.journey_steps
  ADD CONSTRAINT journey_steps_action_type_check
  CHECK (action_type IN ('navigate', 'click', 'fill', 'submit', 'wait', 'assert'));
