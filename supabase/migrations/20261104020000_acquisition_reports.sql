-- Rapports d'avis publics envoyés aux prospects (« valeur d'abord »).
-- Lecture publique uniquement via le serveur (clé service) sur /rapport/[token] ; la table reste réservée aux admins.
create table if not exists public.acquisition_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.acquisition_companies(id) on delete set null,
  token text not null unique check (char_length(token) >= 20),
  subject_name text not null check (char_length(subject_name) between 1 and 200),
  source text not null check (source in ('app_store', 'pasted')),
  source_label text not null check (char_length(source_label) between 1 and 60),
  source_url text,
  review_count integer not null check (review_count >= 0),
  average_rating numeric(2,1) check (average_rating between 1 and 5),
  report jsonb not null,
  view_count integer not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists acquisition_reports_company_idx on public.acquisition_reports (company_id, created_at desc);

alter table public.acquisition_reports enable row level security;

drop policy if exists "admin only acquisition reports" on public.acquisition_reports;
create policy "admin only acquisition reports" on public.acquisition_reports
  for all to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Compteur de vues atomique, appelé par le serveur à chaque ouverture du rapport.
create or replace function public.track_acquisition_report_view(report_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.acquisition_reports
  set view_count = view_count + 1,
      first_viewed_at = coalesce(first_viewed_at, now()),
      last_viewed_at = now()
  where token = report_token and revoked_at is null;
$$;

revoke all on function public.track_acquisition_report_view(text) from public, anon, authenticated;
grant execute on function public.track_acquisition_report_view(text) to service_role;

