# Plan de test réel Qualio Feedback

## 5.0 Accès des testeurs et quota

- [ ] Créer 3 comptes de cohorte A en Gratuit ; ne pas simuler un essai Pro qui n’existe pas dans l’offre.
- [ ] Garder 1 à 2 comptes de cohorte B en Gratuit pour observer la compréhension du quota et des avis en attente.
- [ ] Pour prolonger un accès, exécuter manuellement `scripts/grant-tester-access.sql` avec la clé de service ; ne jamais l’exécuter depuis l’application.
- [ ] Pour le retirer, exécuter `scripts/revoke-tester-access.sql`.
- [ ] Vérifier « Pro (accès test) », la date de fin et le message « Accès offert, pas d’abonnement à gérer ».
- [ ] Au quota atteint : vérifier le nombre utilisé, la remise à zéro au début du mois suivant Europe/Paris et le bouton Passer en Pro.

## 5.1 Parcours, dans l’ordre

1. [ ] Compte neuf : email/OTP ou OAuth (Google/GitHub) → `/dashboard` → `/onboarding`.
   Résultat attendu : aucune question sur site, scan, audit, formulaire ou régression.
2. [ ] Tester OTP, déconnexion et OAuth Google/GitHub.
   Résultat attendu : session correcte, erreurs lisibles, redirection externe refusée.
3. [ ] Vérifier `redirectTo=https://example.com` et `redirectTo=//example.com`.
   Résultat attendu : `/dashboard`.
4. [ ] Vérifier `redirectTo=/dashboard/sites` et `/scan/test`.
   Résultat attendu : `/dashboard`.
5. [ ] Inscription avec consentement résumé décoché puis coché.
   Résultat attendu : `weekly_digest=false` puis `true`, date et source `signup`.
6. [ ] Changer la préférence depuis Réglages.
   Résultat attendu : source `settings`, confirmation visible.
7. [ ] Envoyer 6 inscriptions en moins de 15 minutes depuis une même IP.
   Résultat attendu : la 6e renvoie `429`, `Retry-After` et un texte clair.
8. [ ] Sans session, ouvrir `/dashboard`, `/onboarding`, `/api/sites`, `/api/feedback` et `/api/billing/status`.
   Résultat attendu : redirection pour les pages et `401` pour les APIs protégées.
9. [ ] Créer un projet avec un nom seul, puis un projet avec une URL.
   Résultat attendu : les deux sont acceptés ; l’URL n’est pas obligatoire.
10. [ ] Créer un projet neuf.
    Résultat attendu : seulement la carte CSV, widget, ajout manuel.
11. [ ] Télécharger le CSV d’exemple et importer au moins 30 avis réels.
    Résultat attendu : aperçu/retour importé, lignes ignorées expliquées.
12. [ ] Avec au moins 3 avis, cliquer Générer ma première synthèse.
    Résultat attendu : 3 à 6 recommandations sourcées en moins de 5 minutes ; mesurer le temps.
13. [ ] Installer le widget sur une page HTML de test et envoyer 3 avis.
    Résultat attendu : avis dans Avis, puis bouton Vérifier l’installation positif.
14. [ ] Intake : clé inventée, clé désactivée, JSON invalide, contenu vide, 2 001 caractères, corps >10 Ko.
    Résultat attendu : `403`, `403`, `400/415`, `400`, `400`, `413`.
15. [ ] Envoyer 15 avis rapidement depuis une même IP et renvoyer deux fois le même contenu.
    Résultat attendu : `429` au-delà de 10/minute et doublon ignoré.
16. [ ] Importer CSV valide, lignes invalides, séparateur `;`, BOM UTF-8, fichier >5 Mo et >5 000 lignes.
    Résultat attendu : résultat `{imported, skipped, reasons}` sans erreur technique brute.
17. [ ] Ajouter manuellement un avis de 2 000 caractères puis un avis plus long.
    Résultat attendu : le premier passe, le second est refusé.
18. [ ] Générer avec moins de 3 avis, puis avec 3 avis.
    Résultat attendu : bouton bloqué puis synthèse enregistrée ; chaque ID cité existe.
19. [ ] Accepter, refuser et marquer faite une recommandation.
    Résultat attendu : onglets et compteur dashboard suivent `feedback_recommendations`, pas la dernière synthèse.
20. [ ] Créer un deuxième projet et changer le projet actif dans la sidebar.
    Résultat attendu : avis, sources, thèmes, synthèses et recommandations changent ; rechargement conservé.
21. [ ] Avec un second compte, appeler `/api/feedback?siteId=...` du premier compte.
    Résultat attendu : `401`, `403` ou réponse vide ; aucune donnée lisible.
22. [ ] Rejouer `docs/UI_CHECKLIST.md` sur iPhone Safari 375 px clair/sombre.
23. [ ] Checkout GeniusPay de test, webhook signé, double paiement, retour et annulation.
    Résultat attendu : seul le webhook GeniusPay signé donne l’accès ; un abonné GeniusPay ne peut pas créer un second checkout ; une annulation revient sur une page Qualio ; aucun accès manuel ne lance un portail.
24. [ ] Production : `/`, `/login`, `/widget.js` en 200 ; routes protégées redirigent ou répondent 401.
25. [ ] Ouvrir `/dashboard/sites`, `/dashboard/scans`, `/dashboard/bugs`, `/api/scan/run`.
    Résultat attendu : 404 et aucune erreur Vercel.

## Fiche d’observation MVP (3 à 5 testeurs)

## Test de valeur en 3 tâches

Faire le test en direct, sans guider le testeur. Utiliser un compte Gratuit et le CSV d’exemple. Noter les mots exacts et le temps, sans corriger l’utilisateur pendant la tâche.

1. [ ] **Compréhension** — « Sans cliquer partout, dites-moi ce que fait Qualio et pour qui c’est utile. »
2. [ ] **Première valeur** — « Importez les avis d’exemple, obtenez une recommandation, puis ouvrez un avis qui la prouve. »
3. [ ] **Continuité** — « Après avoir vu la limite ou les avis en attente, dites-moi ce que vous feriez pour continuer. »

### Seuils de réussite avant le test

- [ ] Au moins 4 testeurs sur 5 décrivent correctement le produit et sa cible.
- [ ] Au moins 4 testeurs sur 5 atteignent une première recommandation en moins de 5 minutes, sans aide.
- [ ] Au moins 4 testeurs sur 5 ouvrent au moins une source de recommandation.
- [ ] Au moins 3 testeurs sur 5 identifient correctement le chemin pour continuer après la limite.
- [ ] Chaque objection au paiement est classée : prix, valeur, confiance, besoin de projets ou autre.

| Testeur | Temps inscription → première synthèse | Recommandations utiles (oui/non) | Pourquoi / confusion observée | Paieriez-vous ? combien ? |
| --- | --- | --- | --- | --- |
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

## Commandes de vérification locale

```text
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Sécurité base

Avant application : `supabase db dump --linked --file backup-before-feedback-cleanup.sql` ou export SQL complet depuis Supabase. Les tables QA supprimées ne sont pas restaurables par la migration ; le retour arrière consiste à restaurer la sauvegarde sur un projet de récupération, puis à réimporter les données nécessaires après revue.

## Resend et DNS

Dans Resend : créer un domaine d’envoi sur le domaine Qualio, copier les valeurs affichées pour ce domaine, puis attendre la vérification. Les valeurs SPF et DKIM sont spécifiques au domaine et ne doivent pas être inventées dans le code ; Resend affiche notamment le nom DKIM et la valeur à publier. Ajouter ou fusionner l’SPF avec l’SPF existant, jamais deux enregistrements SPF concurrents. Ajouter un DMARC initial prudent sur `_dmarc` avec `v=DMARC1; p=none; rua=mailto:dmarc@qualio.example`, puis durcir après observation des rapports. Configurer `FEEDBACK_FROM_EMAIL` sur le domaine vérifié et `RESEND_API_KEY` uniquement côté serveur. En développement, définir `RESEND_TEST_EMAIL` et ne pas envoyer aux vraies adresses.
