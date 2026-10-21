create table if not exists public.acquisition_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null,
  website_url text,
  country text,
  company_size text,
  relevance_score smallint check (relevance_score between 0 and 100),
  status text not null default 'discovered' check (status in ('discovered','review','approved','archived')),
  source_url text,
  source_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists acquisition_companies_domain_idx on public.acquisition_companies (lower(domain));

create table if not exists public.acquisition_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.acquisition_companies(id) on delete cascade,
  full_name text,
  role text,
  email text not null,
  email_status text not null default 'unverified' check (email_status in ('unverified','public','verified','invalid','suppressed')),
  email_source_url text,
  confidence smallint check (confidence between 0 and 100),
  created_at timestamptz not null default now()
);

create unique index if not exists acquisition_contacts_email_idx on public.acquisition_contacts (lower(email));

create table if not exists public.acquisition_signals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.acquisition_companies(id) on delete cascade,
  signal_type text not null,
  label text not null,
  source_url text not null,
  evidence text,
  confidence smallint check (confidence between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.acquisition_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acquisition_contacts(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft','approved','sent','replied','bounced','suppressed')),
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.acquisition_visitor_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_name text not null,
  path text not null,
  referrer text,
  company_domain text,
  prospect_company_id uuid references public.acquisition_companies(id) on delete set null,
  consented boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.acquisition_companies enable row level security;
alter table public.acquisition_contacts enable row level security;
alter table public.acquisition_signals enable row level security;
alter table public.acquisition_messages enable row level security;
alter table public.acquisition_visitor_events enable row level security;

create policy "admin only acquisition companies" on public.acquisition_companies for all to authenticated using ((select auth.jwt()->'app_metadata'->>'role') = 'admin') with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin only acquisition contacts" on public.acquisition_contacts for all to authenticated using ((select auth.jwt()->'app_metadata'->>'role') = 'admin') with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin only acquisition signals" on public.acquisition_signals for all to authenticated using ((select auth.jwt()->'app_metadata'->>'role') = 'admin') with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin only acquisition messages" on public.acquisition_messages for all to authenticated using ((select auth.jwt()->'app_metadata'->>'role') = 'admin') with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin only acquisition visitor events" on public.acquisition_visitor_events for all to authenticated using ((select auth.jwt()->'app_metadata'->>'role') = 'admin') with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
