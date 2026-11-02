-- Adresses à ne plus jamais contacter (déjà contactées, invalides ou désinscrites).
-- Conservée lors d'une remise à zéro de la prospection pour ne jamais renvoyer un mail à la même personne.
create table if not exists public.acquisition_do_not_contact (
  email text primary key check (email = lower(email)),
  reason text not null default 'already_contacted',
  created_at timestamptz not null default now()
);

alter table public.acquisition_do_not_contact enable row level security;
-- Aucune policy : seul le service role (backend admin) y accède.
