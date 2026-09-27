-- ══════════════════════════════════════════════════════════════════════════════
-- Script de Vérification : Supabase Storage pour Screenshots
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- ══════════════════════════════════════════════════════════════════════════════

\echo '🗄️  VÉRIFICATION SUPABASE STORAGE - SCREENSHOTS\n'
\echo '══════════════════════════════════════════════════════════════════════════════\n'

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Vérifier que le bucket 'screenshots' existe
-- ──────────────────────────────────────────────────────────────────────────────
\echo '1️⃣  Bucket Storage'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM storage.buckets 
      WHERE name = 'screenshots'
    ) THEN '✅ BUCKET EXISTS'
    ELSE '❌ BUCKET MISSING - Exécuter la migration principale!'
  END AS bucket_status;

SELECT 
  id,
  name,
  CASE WHEN public THEN '🌐 Public' ELSE '🔒 Private (Correct)' END as access_type,
  created_at,
  updated_at
FROM storage.buckets
WHERE name = 'screenshots';

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Vérifier les politiques RLS sur storage.objects
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n2️⃣  Politiques RLS Storage'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT 
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Politiques présentes'
    WHEN COUNT(*) = 1 THEN '⚠️  1 politique seulement (il en faut 2)'
    ELSE '❌ Aucune politique! Réappliquer la migration'
  END as status
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%screenshot%';

\echo '\nDétail des politiques:'
SELECT 
  policyname,
  CASE 
    WHEN cmd = 'INSERT' THEN '📤 Upload'
    WHEN cmd = 'SELECT' THEN '👁️  Download'
    ELSE cmd
  END as operation,
  CASE 
    WHEN roles::text LIKE '%authenticated%' THEN '✅ Authenticated'
    ELSE roles::text
  END as who_can_access
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%screenshot%'
ORDER BY policyname;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Vérifier la table screenshots
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n3️⃣  Table Screenshots'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'screenshots'
    ) THEN '✅ TABLE EXISTS'
    ELSE '❌ TABLE MISSING'
  END AS table_status;

\echo '\nStatistiques de la table:'
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN n_live_tup = 0 THEN '○ Aucun screenshot'
    ELSE '✅ ' || n_live_tup || ' screenshot(s)'
  END as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_stat_user_tables
WHERE tablename = 'screenshots';

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Vérifier les politiques RLS sur la table screenshots
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n4️⃣  Politiques RLS Table Screenshots'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT 
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ Au moins 1 politique active'
    ELSE '❌ Aucune politique RLS! Données non protégées!'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'screenshots';

SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN roles::text LIKE '%authenticated%' THEN '✅ Authenticated users'
    ELSE roles::text
  END as applies_to
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'screenshots';

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Vérifier les foreign keys de la table screenshots
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n5️⃣  Foreign Keys'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.screenshots'::regclass
AND contype = 'f'
ORDER BY conname;

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Vérifier les fichiers dans storage (5 derniers)
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n6️⃣  Fichiers dans Storage'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT 
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'screenshots';

\echo '\n5 derniers fichiers uploadés:'
SELECT 
  name as filename,
  pg_size_pretty((metadata->>'size')::bigint) as file_size,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'screenshots'
ORDER BY created_at DESC
LIMIT 5;

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. Vérifier la cohérence entre screenshots (table) et storage (fichiers)
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n7️⃣  Cohérence Table ↔ Storage'
\echo '────────────────────────────────────────────────────────────────────────────'

WITH 
  table_count AS (
    SELECT COUNT(*) as cnt FROM public.screenshots
  ),
  storage_count AS (
    SELECT COUNT(*) as cnt FROM storage.objects WHERE bucket_id = 'screenshots'
  )
SELECT 
  table_count.cnt as screenshots_in_table,
  storage_count.cnt as files_in_storage,
  CASE 
    WHEN table_count.cnt = storage_count.cnt THEN '✅ Perfect match'
    WHEN table_count.cnt > storage_count.cnt THEN '⚠️  Plus de records que de fichiers'
    WHEN table_count.cnt < storage_count.cnt THEN '⚠️  Plus de fichiers que de records'
    ELSE '○ Vide'
  END as consistency_status
FROM table_count, storage_count;

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. Vérifier les screenshots orphelins (dans table mais pas dans storage)
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n8️⃣  Screenshots Orphelins'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT 
  s.id,
  s.storage_path,
  s.created_at,
  CASE 
    WHEN o.name IS NULL THEN '❌ Fichier manquant'
    ELSE '✅ Fichier présent'
  END as file_status
FROM public.screenshots s
LEFT JOIN storage.objects o 
  ON o.bucket_id = 'screenshots' 
  AND o.name = s.storage_path
WHERE o.name IS NULL
LIMIT 5;

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. Test d'URL signée (nécessite un screenshot existant)
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n9️⃣  Test URL Signée'
\echo '────────────────────────────────────────────────────────────────────────────'

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 
      '✅ ' || COUNT(*) || ' screenshot(s) disponibles pour test'
    ELSE 
      '⚠️  Aucun screenshot pour tester les URLs signées'
  END as test_status
FROM public.screenshots
LIMIT 1;

\echo '\nPremier screenshot (pour tester URL signée manuellement):'
SELECT 
  id,
  storage_path,
  viewport,
  created_at
FROM public.screenshots
ORDER BY created_at DESC
LIMIT 1;

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. Résumé Global
-- ──────────────────────────────────────────────────────────────────────────────
\echo '\n🎯 RÉSUMÉ GLOBAL'
\echo '══════════════════════════════════════════════════════════════════════════════'

WITH checks AS (
  SELECT 
    EXISTS (SELECT FROM storage.buckets WHERE name = 'screenshots') as bucket_ok,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%screenshot%') >= 2 as storage_policies_ok,
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'screenshots') as table_ok,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'screenshots') >= 1 as table_policies_ok
)
SELECT 
  CASE WHEN bucket_ok THEN '✅' ELSE '❌' END || ' Bucket "screenshots"' as check_1,
  CASE WHEN storage_policies_ok THEN '✅' ELSE '❌' END || ' Politiques Storage RLS' as check_2,
  CASE WHEN table_ok THEN '✅' ELSE '❌' END || ' Table "screenshots"' as check_3,
  CASE WHEN table_policies_ok THEN '✅' ELSE '❌' END || ' Politiques Table RLS' as check_4,
  CASE 
    WHEN bucket_ok AND storage_policies_ok AND table_ok AND table_policies_ok 
    THEN '🎉 CONFIGURATION COMPLÈTE ET VALIDE'
    ELSE '⚠️  CONFIGURATION INCOMPLÈTE - Voir détails ci-dessus'
  END as overall_status
FROM checks;

\echo '\n══════════════════════════════════════════════════════════════════════════════'
\echo '✅ Vérification terminée\n'

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMANDES UTILES POUR DÉPANNAGE
-- ══════════════════════════════════════════════════════════════════════════════

\echo '🔧 COMMANDES DE DÉPANNAGE'
\echo '══════════════════════════════════════════════════════════════════════════════'
\echo '\nSi le bucket manque:'
\echo '  INSERT INTO storage.buckets (id, name, public) VALUES (''screenshots'', ''screenshots'', false);'
\echo '\nSi les politiques manquent:'
\echo '  Réexécuter: supabase/migrations/20260925194500_qualio_schema_v2.sql'
\echo '\nPour tester une URL signée via SQL:'
\echo '  SELECT storage.create_signed_url(''screenshots'', storage_path, 3600) FROM screenshots LIMIT 1;'
\echo '\nPour voir l''espace utilisé:'
\echo '  SELECT pg_size_pretty(SUM((metadata->>''size'')::bigint)) FROM storage.objects WHERE bucket_id = ''screenshots'';'
\echo '\n══════════════════════════════════════════════════════════════════════════════\n'
