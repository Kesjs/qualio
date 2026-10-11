-- Widget presentation settings. The public key remains write-only for intake;
-- these values are only emitted in the user's authenticated collection screen.
ALTER TABLE public.collection_sources
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#ee6018',
  ADD COLUMN IF NOT EXISTS position TEXT NOT NULL DEFAULT 'right',
  ADD COLUMN IF NOT EXISTS button_label TEXT NOT NULL DEFAULT 'Laisser un avis';

ALTER TABLE public.collection_sources
  DROP CONSTRAINT IF EXISTS collection_sources_position_check;

ALTER TABLE public.collection_sources
  ADD CONSTRAINT collection_sources_position_check
  CHECK (position IN ('left', 'right'));

ALTER TABLE public.collection_sources
  DROP CONSTRAINT IF EXISTS collection_sources_accent_color_check;

ALTER TABLE public.collection_sources
  ADD CONSTRAINT collection_sources_accent_color_check
  CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE public.collection_sources
  DROP CONSTRAINT IF EXISTS collection_sources_button_label_check;

ALTER TABLE public.collection_sources
  ADD CONSTRAINT collection_sources_button_label_check
  CHECK (char_length(btrim(button_label)) BETWEEN 1 AND 60);

