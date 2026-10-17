# Landing Qualio — direction validée, octobre 2026

Surface : `/`, mode Impeccable Persuade. Implémentation : `RefreshLanding.tsx`, `LandingDemos.tsx`, `landing-refresh.module.css`.

## Direction

Le hero validé est « Des centaines d’avis. Une direction plus claire. ». La description précise les thèmes, les retours qui les expliquent et les pistes à examiner. La page démontre le passage des avis aux recommandations, puis le suivi et la collecte. Les exemples sont fictifs et signalés. Les interactions de démonstration ne transmettent aucune donnée.

## Références et décisions

- Identité existante : Manrope, orange d’action, surfaces blanches et gris neutre, cadres fins, section sombre pour le suivi. Le système du dashboard reste régi par DESIGN.md.
- Brief utilisateur : hero et séquence des sections validés dans la conversation ; implémentation directe autorisée, sans nouvelle exploration d’identité.
- Impeccable `layout` : sections de densités différentes ; hiérarchie portée par les titres et la démonstration, sans étiquettes au-dessus des titres.
- Impeccable `clarify` : démos identifiées, limites gratuites explicites, bénéfices des plans reliés à leur usage ; évolution des avis plutôt que causalité attribuée aux décisions.
- Impeccable `animate` : une séquence de trois étapes, contrôlable par boutons et rejouable ; arrêt hors écran ; réduction des mouvements ; transitions locales de 200 à 500 ms.
- Impeccable `adapt` et `polish` : grille desktop, pile mobile, champs de 16 px sur mobile, cibles tactiles, focus visible, test des états sources/décisions/formulaire.

## Règles propres à cette surface

Conteneur 1152 px ; texte #18181b ; secondaire #62626b ; traits #e6e6ea ; action #c2410c ; blanc dominant. Titres de section fluides de 30 à 48 px, hero de 32 à 76 px suivant le viewport. Cadres de démonstration de 12 px et contrôles de 6 à 8 px. Aucune dépendance ajoutée ; motion réutilise Framer Motion.

Les plans et tarifs restent issus de `src/lib/billing/plans.ts`. PRODUCT.md contient des offres historiques : elles ne doivent pas être réutilisées pour cette surface.
