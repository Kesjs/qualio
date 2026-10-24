-- Relie les événements consentis du site aux messages de prospection,
-- sans exposer l'adresse email du prospect dans l'URL.
alter table public.acquisition_visitor_events
  add column if not exists acquisition_message_id uuid references public.acquisition_messages(id) on delete set null,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text;

create index if not exists acquisition_visitor_events_message_idx
  on public.acquisition_visitor_events (acquisition_message_id, created_at desc);
