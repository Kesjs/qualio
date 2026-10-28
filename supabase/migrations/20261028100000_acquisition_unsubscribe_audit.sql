-- Preuve des désinscriptions de prospection : quand et comment l'adresse a été exclue.
-- Les envois restent bloqués par email_status = 'suppressed' même si cette migration n'est pas encore appliquée.
alter table public.acquisition_contacts
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_source text;

create index if not exists acquisition_contacts_unsubscribed_idx
  on public.acquisition_contacts (unsubscribed_at)
  where unsubscribed_at is not null;
