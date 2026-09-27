-- Script de vérification : Table journey_steps
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- ou via : psql <connection-string> -f verify-journey-steps-table.sql

\echo '🔍 Vérification de la table journey_steps...\n'

-- 1. Vérifier si la table existe
\echo '1️⃣ Vérification existence de la table:'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'journey_steps'
    ) THEN '✅ Table journey_steps existe'
    ELSE '❌ Table journey_steps manquante - Appliquer la migration 20260926_create_journey_steps.sql'
  END AS status;

\echo '\n2️⃣ Structure de la table (colonnes):'
SELECT 
  column_name,
  data_type,
  CASE WHEN is_nullable = 'NO' THEN '✅ NOT NULL' ELSE '○ nullable' END as nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'journey_steps'
ORDER BY ordinal_position;

\echo '\n3️⃣ Index créés:'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'journey_steps'
ORDER BY indexname;

\echo '\n4️⃣ Contraintes (Foreign Keys):'
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.journey_steps'::regclass
ORDER BY conname;

\echo '\n5️⃣ Politiques RLS:'
SELECT 
  policyname,
  cmd AS command,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Read'
    WHEN cmd = 'ALL' THEN '🔓 Full Access'
    ELSE cmd
  END as access_level,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'journey_steps'
ORDER BY policyname;

\echo '\n6️⃣ Statistiques de la table:'
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN n_live_tup = 0 THEN '○ Vide'
    ELSE '✅ ' || n_live_tup || ' lignes'
  END as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_stat_user_tables
WHERE tablename = 'journey_steps';

\echo '\n7️⃣ Exemple de données (5 dernières entrées):'
SELECT 
  journey_name,
  step_order,
  step_name,
  status,
  CASE 
    WHEN screenshot_id IS NOT NULL THEN '📸 Oui'
    ELSE '○ Non'
  END as has_screenshot,
  duration_ms,
  created_at
FROM public.journey_steps
ORDER BY created_at DESC
LIMIT 5;

\echo '\n✅ Vérification terminée\n'
