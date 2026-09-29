# Supabase migration

The migration `20260929184948_add_fix_context_and_site_stack.sql` adds the persisted correction context to `issues` and the optional stack/provider metadata to `sites`.

Apply it against the connected Supabase project with the project's normal migration workflow, for example:

```bash
npx supabase db push
```

This workspace was not connected to a live Supabase project during the implementation, so the migration is included in the ZIP but has not been applied remotely. After applying it, verify that the dashboard can create a site, launch a scan, open an issue, and copy its correction prompt.
