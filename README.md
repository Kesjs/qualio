# Qualio

Qualio transforme des avis clients en décisions produit.

Le parcours tient en trois entrées : import CSV, widget embarqué et ajout manuel. Les avis sont regroupés par thèmes, synthétisés avec leurs sources, puis convertis en recommandations que l’équipe accepte, refuse ou marque comme faites.

## Développement

```text
npm install
npm run dev
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Base de données (Supabase, projet « braviko »)

1. Copier `.env.example` vers `.env.local` et renseigner `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API Keys, clé secrète, serveur uniquement). L'URL et la clé publique de braviko sont déjà dans `.env.local`.
2. Les 36 migrations de `supabase/migrations/` sont **déjà appliquées** sur braviko ; leurs numéros de version sont alignés sur l'historique distant (`supabase migration list` doit afficher local = distant).
3. Après un changement de schéma, régénérer `src/lib/supabase/database.types.ts` (`supabase gen types typescript --project-id cddxzwadhvosiiewkgox`).

Les migrations nouvelles sont dans `supabase/migrations/`. Elles doivent être sauvegardées et relues avant toute application. Aucune commande distante Supabase ne fait partie du build.

## Documentation

- [Vision Feedback](docs/PRODUCT_VISION.md)
- [Plan de test réel](docs/TEST_PLAN.md)
- [Checklist UI](docs/UI_CHECKLIST.md)
