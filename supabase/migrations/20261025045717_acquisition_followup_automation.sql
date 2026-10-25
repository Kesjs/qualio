-- Séquence de prospection contrôlée : trois relances maximum, espacées et stoppables.
alter table public.acquisition_messages
  add column if not exists sequence_stage smallint not null default 0,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz;

create index if not exists acquisition_messages_followup_due_idx
  on public.acquisition_messages (next_follow_up_at)
  where next_follow_up_at is not null;
