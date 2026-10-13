-- La fonction n'utilise que now() (pg_catalog) : un search_path vide est sûr.
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
