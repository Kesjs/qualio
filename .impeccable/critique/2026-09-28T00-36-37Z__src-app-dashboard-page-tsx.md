---
target: Sites nécessitant une action
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\kenke\\qualio\\src\\app\\dashboard\\page.tsx"
target_fingerprint: "sha256:1fa47ab711b5e5efe3ddf246030e9e65a70b2f4a9d80a26d5b6454ea8598b5bc"
target_path: "C:\\Users\\kenke\\qualio\\src\\app\\dashboard\\page.tsx"
timestamp: 2026-09-28T00-36-37Z
slug: src-app-dashboard-page-tsx
---
# Critique — Sites nécessitant une action

## Design Health Score

| # | Heuristique | Score | Problème clé |
|---|---|---:|---|
| 1 | Visibilité de l’état système | 2/4 | Le re-test n’affiche ni progression ni résultat. |
| 2 | Correspondance avec le monde réel | 3/4 | « cible(s) » est moins clair que « sites à vérifier ». |
| 3 | Contrôle et liberté | 1/4 | Aucune option visible pour ignorer, annuler ou consulter l’historique. |
| 4 | Cohérence et standards | 3/4 | Les rangées sont cohérentes ; l’icône seule est ambiguë. |
| 5 | Prévention des erreurs | 2/4 | Rien n’indique ce qui sera re-testé avant le clic. |
| 6 | Reconnaissance plutôt que mémorisation | 3/4 | Les CTA sont visibles ; l’icône sans texte demande une interprétation. |
| 7 | Flexibilité et efficacité | 1/4 | Pas de tri, de filtre ou de re-test groupé. |
| 8 | Esthétique et minimalisme | 3/4 | Solide, mais les trois alertes identiques créent une fatigue d’alerte. |
| 9 | Reconnaître/résoudre les erreurs | 2/4 | L’alerte ne donne pas de cause ni de prochain geste autre que re-tester. |
| 10 | Aide et documentation | 0/4 | Aucune explication de la criticité. |
| **Total** | | **20/40** | **Acceptable — améliorations significatives nécessaires** |

## Verdict de spécificité

Le composant est cohérent avec Qualio, mais reste une liste d’incidents assez générique. Il devrait afficher le parcours cassé, l’environnement et une preuve ou un diagnostic court afin de refléter l’exécution Playwright et la valeur IA du produit.

Le détecteur n’a trouvé aucune alerte dans `src/app/dashboard/page.tsx`. Le navigateur a confirmé la structure et l’accessibilité de base : titre, compteur, trois boutons Re-tester, trois liens détaillés et un bouton Lancer. Aucune surcouche de détection n’a été nécessaire.

## Ce qui fonctionne

- Hiérarchie très lisible : contexte, compteur, liste et actions se comprennent immédiatement.
- Les cartes bloquantes et l’état de premier audit sont bien distingués.
- « Re-tester » est une action directe qui correspond au flux post-correction de Qualio.

## Priorités

1. **[P1] Priorisation insuffisante.** Trois alertes reçoivent le même poids alors que l’utilisateur doit choisir laquelle impacte le plus le business. Afficher environnement, dernier scan, parcours affecté et impact ; trier par impact.
2. **[P1] Contrat du re-test absent.** Le CTA ne dit pas ce qu’il teste ni ce qui se passe ensuite. Montrer « Re-tester le parcours Checkout », un état de progression, puis un résultat/diff.
3. **[P1] Valeur produit invisible.** « 1 anomalie critique » est trop générique. Remplacer par une phrase d’impact factuelle, par exemple « Le bouton Créer un compte renvoie HTTP 404 ».
4. **[P2] Scroll interne prématuré.** Quatre éléments ne devraient pas masquer le dernier. Afficher toute la liste à cette taille, ou ajouter « Voir les 4 sites ».
5. **[P2] Icône de détail ambiguë.** Utiliser « Voir le détail » ou un tooltip accessible, avec une cible tactile d’au moins 44 px.

## Personas

- **Alex (expert)** : pas de tri, filtre ni re-test groupé pour trois problèmes identiques.
- **Jordan (premier utilisateur)** : il voit l’urgence mais ne sait pas quel parcours est cassé ni pourquoi re-tester.
- **Sam (clavier/lecteur d’écran)** : l’état repose beaucoup sur le rouge ; vérifier un nom accessible de l’icône et un focus visible.

## Observations

- Préférer « 4 sites à vérifier » à « 4 cible(s) ».
- Préférer « Lancer le premier audit » à « Lancer ».
- Vérifier le contraste du texte secondaire.
