# Guide : Vérifier et Appliquer les Migrations Manquantes

## 🔍 Vérifier l'état des migrations

### Option 1 : Via Supabase CLI

```powershell
# Vérifier le statut des migrations
supabase migration list

# Voir quelle migration est la dernière appliquée
supabase db dump --schema public
```

### Option 2 : Via SQL Direct (Dashboard Supabase)

```sql
-- Vérifier si la table journey_steps existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'journey_steps';

-- Si la table existe, voir sa structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'journey_steps'
ORDER BY ordinal_position;
```

---

## ✅ Appliquer la migration journey_steps

### Méthode 1 : Supabase CLI (Recommandé)

```powershell
# Se connecter au projet Supabase
supabase link --project-ref <votre-project-ref>

# Appliquer toutes les migrations en attente
supabase db push

# OU appliquer uniquement la migration journey_steps
supabase migration up 20260926_create_journey_steps
```

### Méthode 2 : Via le Dashboard Supabase (SQL Editor)

1. Ouvrir https://supabase.com/dashboard/project/<votre-project-ref>/editor
2. Cliquer sur "SQL Editor" dans le menu de gauche
3. Créer une nouvelle query
4. Copier-coller le contenu de `supabase/migrations/20260926_create_journey_steps.sql`
5. Exécuter la query
6. Vérifier qu'il n'y a pas d'erreurs

### Méthode 3 : Copier-coller le SQL complet

Si vous préférez exécuter le SQL manuellement, voici le contenu à copier :

```sql
-- Migration: Création de la table journey_steps pour les user journeys
-- Description: Stocke chaque étape d'un parcours utilisateur exécuté par Playwright

-- Table principale : journey_steps
CREATE TABLE IF NOT EXISTS public.journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
  
  -- Identification de l'étape
  journey_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  
  -- Action effectuée
  action_type TEXT NOT NULL,
  action_target TEXT,
  action_details JSONB,
  
  -- Résultat de l'étape
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'not_reached', 'skip')),
  result_payload JSONB,
  error_message TEXT,
  
  -- Screenshot (capturé uniquement en cas d'échec)
  screenshot_id UUID REFERENCES public.screenshots(id) ON DELETE SET NULL,
  
  -- Métadonnées
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index pour les requêtes fréquentes
  CONSTRAINT journey_steps_scan_step_unique UNIQUE (scan_id, journey_name, step_order)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_journey_steps_scan_id ON public.journey_steps(scan_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_issue_id ON public.journey_steps(issue_id) WHERE issue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journey_steps_status ON public.journey_steps(status);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey_name ON public.journey_steps(journey_name);

-- RLS (Row Level Security)
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir les journey_steps de leurs propres scans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey_steps' 
    AND policyname = 'Users can view their own journey steps'
  ) THEN
    CREATE POLICY "Users can view their own journey steps"
      ON public.journey_steps
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.scans
          WHERE scans.id = journey_steps.scan_id
          AND scans.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Politique : Le service peut insérer/modifier les journey_steps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journey_steps' 
    AND policyname = 'Service role can manage journey steps'
  ) THEN
    CREATE POLICY "Service role can manage journey steps"
      ON public.journey_steps
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Commentaires pour documentation
COMMENT ON TABLE public.journey_steps IS 'Stocke chaque étape d''un parcours utilisateur (user journey) exécuté par Playwright pendant un scan';
COMMENT ON COLUMN public.journey_steps.journey_name IS 'Nom du parcours complet (ex: "Lead & Demo Conversion Flow")';
COMMENT ON COLUMN public.journey_steps.step_order IS 'Position de l''étape dans le parcours (commence à 1)';
COMMENT ON COLUMN public.journey_steps.step_name IS 'Nom descriptif de l''étape (ex: "Homepage", "Click CTA")';
COMMENT ON COLUMN public.journey_steps.action_type IS 'Type d''action Playwright : navigation, click, fill, submit, wait';
COMMENT ON COLUMN public.journey_steps.status IS 'Résultat de l''étape : pass (réussi), fail (échec), not_reached (étape suivante non atteinte après échec), skip (ignorée)';
COMMENT ON COLUMN public.journey_steps.screenshot_id IS 'Screenshot capturé à cette étape (uniquement si échec)';
COMMENT ON COLUMN public.journey_steps.result_payload IS 'Données techniques : HTTP status, network errors, console logs, DOM state, etc.';
```

---

## 🧪 Vérifier que la migration a bien été appliquée

Après avoir appliqué la migration, exécutez ces requêtes pour vérifier :

```sql
-- 1. Vérifier que la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'journey_steps'
) AS table_exists;

-- 2. Vérifier le nombre de colonnes (devrait être 13)
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'journey_steps';

-- 3. Vérifier les index créés (devrait en avoir 4)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'journey_steps'
ORDER BY indexname;

-- 4. Vérifier les politiques RLS (devrait en avoir 2)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'journey_steps'
ORDER BY policyname;

-- 5. Vérifier les foreign keys (devrait en avoir 4)
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conrelid = 'journey_steps'::regclass
AND contype = 'f';
```

Résultats attendus :
- ✅ `table_exists` = TRUE
- ✅ `column_count` = 13
- ✅ 4 index (scan_id, issue_id, status, journey_name)
- ✅ 2 politiques RLS
- ✅ 4 foreign keys (scan_id, page_id, issue_id, screenshot_id)

---

## 🚀 Après l'application de la migration

### 1. Tester avec des données fictives

```sql
-- Insérer un journey step de test (en tant que service_role)
INSERT INTO public.journey_steps (
  scan_id,
  journey_name,
  step_order,
  step_name,
  action_type,
  action_target,
  status,
  error_message,
  duration_ms
) VALUES (
  (SELECT id FROM public.scans LIMIT 1), -- Utiliser un scan existant
  'Test Journey',
  1,
  'Test Step',
  'click',
  '#test-button',
  'fail',
  'Element not found',
  1500
);

-- Vérifier l'insertion
SELECT * FROM public.journey_steps ORDER BY created_at DESC LIMIT 1;
```

### 2. Tester l'exécution d'un vrai journey

Utiliser le script de test :

```typescript
import { testJourneyExecution } from '@/lib/qa/journeys/test-journey-execution'

// Exécuter un journey de test
await testJourneyExecution('https://example.com', 'test_scan_123')
```

### 3. Vérifier l'affichage dans l'UI

1. Lancer l'application : `npm run dev`
2. Naviguer vers un scan avec journey steps
3. Ouvrir l'Evidence Drawer
4. Cliquer sur l'onglet "User Journeys" (avec icône 🗺️)
5. Vérifier que les steps s'affichent correctement

---

## ⚠️ Troubleshooting

### Erreur : "relation journey_steps does not exist"

➡️ La migration n'a pas été appliquée. Utilisez une des méthodes ci-dessus.

### Erreur : "permission denied for table journey_steps"

➡️ Problème de RLS. Vérifiez que les politiques sont bien créées :

```sql
SELECT * FROM pg_policies WHERE tablename = 'journey_steps';
```

### Erreur : "duplicate key value violates unique constraint"

➡️ Vous essayez d'insérer le même step_order deux fois pour le même scan/journey.

```sql
-- Voir les doublons potentiels
SELECT scan_id, journey_name, step_order, COUNT(*)
FROM public.journey_steps
GROUP BY scan_id, journey_name, step_order
HAVING COUNT(*) > 1;
```

---

## 📁 Fichiers de Migration

Toutes les migrations se trouvent dans :
```
supabase/migrations/
├── 20260925194500_qualio_schema_v2.sql        (Schema principal)
├── 20260926120000_qualio_add_ai_metrics.sql    (Métriques AI)
└── 20260926_create_journey_steps.sql           (Journey steps) ← NOUVELLE
```

---

## 🔗 Ressources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
