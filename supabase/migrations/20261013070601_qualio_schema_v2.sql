-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  scans_count INT DEFAULT 0,
  max_scans INT DEFAULT 5,
  staging_header TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Table: sites
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT,
  environment TEXT DEFAULT 'production',
  last_scan_id UUID, -- Will reference scans(id) but circular dependency for now
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own sites" ON public.sites;
CREATE POLICY "Users can manage their own sites" ON public.sites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: scans
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'created',
  depth TEXT DEFAULT 'quick',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  pages_discovered INT DEFAULT 0,
  checks_total INT DEFAULT 0,
  checks_passed INT DEFAULT 0,
  checks_warning INT DEFAULT 0,
  checks_failed INT DEFAULT 0,
  critical_count INT DEFAULT 0,
  major_count INT DEFAULT 0,
  summary TEXT,
  error TEXT,
  previous_scan_id UUID REFERENCES public.scans(id),
  consent_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own scans" ON public.scans;
CREATE POLICY "Users can manage their own scans" ON public.scans
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add foreign key constraint to sites for last_scan_id
ALTER TABLE public.sites 
  DROP CONSTRAINT IF EXISTS fk_last_scan;
ALTER TABLE public.sites 
  ADD CONSTRAINT fk_last_scan FOREIGN KEY (last_scan_id) REFERENCES public.scans(id) ON DELETE SET NULL;

-- Table: pages
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  final_url TEXT,
  status_code INT,
  response_time_ms INT,
  title TEXT,
  depth INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own scanned pages" ON public.pages;
CREATE POLICY "Users can view their own scanned pages" ON public.pages
  FOR SELECT TO authenticated USING (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

-- Table: checks
CREATE TABLE IF NOT EXISTS public.checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  category TEXT,
  key TEXT,
  status TEXT,
  severity TEXT,
  title TEXT,
  message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own checks" ON public.checks;
CREATE POLICY "Users can view their own checks" ON public.checks
  FOR SELECT TO authenticated USING (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

-- Table: issues
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  category TEXT,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  suggestion TEXT,
  confidence TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own issues" ON public.issues;
CREATE POLICY "Users can manage their own issues" ON public.issues
  FOR ALL TO authenticated USING (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  ) WITH CHECK (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

-- Table: evidence
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
  type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own evidence" ON public.evidence;
CREATE POLICY "Users can view their own evidence" ON public.evidence
  FOR SELECT TO authenticated USING (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

-- Table: screenshots
CREATE TABLE IF NOT EXISTS public.screenshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  page_id UUID,
  issue_id UUID,
  storage_path TEXT NOT NULL,
  viewport TEXT DEFAULT 'desktop',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own screenshots" ON public.screenshots;
CREATE POLICY "Users can view their own screenshots" ON public.screenshots
  FOR SELECT TO authenticated USING (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
CREATE POLICY "Users can upload their own screenshots" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view their own screenshots" ON storage.objects;
CREATE POLICY "Users can view their own screenshots" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'screenshots' AND (storage.foldername(name))[1] = auth.uid()::text
  );
