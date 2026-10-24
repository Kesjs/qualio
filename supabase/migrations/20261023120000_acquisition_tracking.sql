-- Suivi des envois de prospection : livraison, rebond, réponse, relance.
alter table public.acquisition_messages
  add column if not exists delivered_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists bounce_reason text,
  add column if not exists replied_at timestamptz,
  add column if not exists follow_up_of uuid references public.acquisition_messages(id) on delete set null;

create index if not exists acquisition_messages_contact_idx on public.acquisition_messages (contact_id);
create index if not exists acquisition_messages_status_sent_idx on public.acquisition_messages (status, sent_at desc);
create index if not exists acquisition_messages_provider_idx on public.acquisition_messages (provider_message_id) where provider_message_id is not null;
