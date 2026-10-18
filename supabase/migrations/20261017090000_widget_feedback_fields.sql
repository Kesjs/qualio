ALTER TABLE public.collection_sources
  ADD COLUMN IF NOT EXISTS thank_you_message TEXT NOT NULL DEFAULT 'Votre message a bien été envoyé.',
  ADD COLUMN IF NOT EXISTS form_title TEXT NOT NULL DEFAULT 'Votre avis compte',
  ADD COLUMN IF NOT EXISTS form_intro TEXT NOT NULL DEFAULT 'Dites-nous ce qui fonctionne ou ce qui pourrait être amélioré.',
  ADD COLUMN IF NOT EXISTS form_question TEXT NOT NULL DEFAULT 'Votre avis';

ALTER TABLE public.collection_sources
  DROP CONSTRAINT IF EXISTS collection_sources_widget_copy_check;

ALTER TABLE public.collection_sources
  ADD CONSTRAINT collection_sources_widget_copy_check CHECK (
    char_length(thank_you_message) BETWEEN 1 AND 200 AND
    char_length(form_title) BETWEEN 1 AND 120 AND
    char_length(form_intro) BETWEEN 1 AND 300 AND
    char_length(form_question) BETWEEN 1 AND 160
  );
