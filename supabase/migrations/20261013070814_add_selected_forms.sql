-- Targeted form audits keep the user's explicit selection with the scan.
alter table public.scans
  add column if not exists selected_forms jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'scans_selected_forms_array'
      and conrelid = 'public.scans'::regclass
  ) then
    alter table public.scans
      add constraint scans_selected_forms_array
      check (selected_forms is null or jsonb_typeof(selected_forms) = 'array');
  end if;
end $$;
