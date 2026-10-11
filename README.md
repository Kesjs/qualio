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

Les migrations nouvelles sont dans `supabase/migrations/`. Elles doivent être sauvegardées et relues avant toute application. Aucune commande distante Supabase ne fait partie du build.

## Documentation

- [Vision Feedback](docs/PRODUCT_VISION.md)
- [Plan de test réel](docs/TEST_PLAN.md)
- [Checklist UI](docs/UI_CHECKLIST.md)
