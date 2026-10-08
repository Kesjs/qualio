begin;

drop policy "Users can view their own sites" on public.sites;
drop policy "Users can insert their own sites" on public.sites;
drop policy "Users can update their own sites" on public.sites;
drop policy "Users can delete their own sites" on public.sites;

drop policy "Users can view their own scans" on public.scans;
drop policy "Users can insert their own scans" on public.scans;
drop policy "Users can update their own scans" on public.scans;

drop policy "Users can view pages from their scans" on public.pages;
drop policy "Users can view issues from their scans" on public.issues;
drop policy "Users can view checks from their scans" on public.checks;
drop policy "Users can view evidence from their scans" on public.evidence;

commit;
