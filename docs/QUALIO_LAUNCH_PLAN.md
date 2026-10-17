# Qualio — plan de lancement commun

Décisions confirmées le 13 octobre 2026. Document source : `qualio-v1-lancement (7).md`, version 1.6. Référence mise à jour : `docs/QUALIO_LAUNCH.md`.

## Cible validée

Lancer Gratuit, Pro et Agence ensemble, avec les fonctions V1 et V1.1. Ne pas ouvrir les achats avant vérification du compte marchand Stripe, des encaissements et de toutes les fonctions promises.

| Offre | Mensuel / annuel | Projets | Avis conservés par projet |
|---|---|---:|---:|
| Gratuit | 0 € | 1 | 50 |
| Pro | 19 € / 190 € | 5 | 2 000 |
| Agence | 49 € / 490 € | 15 | 10 000 |

- Gratuit : 2 synthèses manuelles sur une fenêtre glissante de 30 jours.
- Pro et Agence : une synthèse manuelle par jour UTC et projet, plus une synthèse automatique hebdomadaire indépendante du consentement email.
- Pro et Agence : widget, email du lundi à 08:00 UTC, historique, alertes de hausse.
- Agence : rapport partageable anonymisé, révocable, expirant après 90 jours.
- Aucun nouvel essai ; honorer les essais existants jusqu’à leur échéance.
- Préserver les données, le hero, Qualio, les thèmes clair/sombre et les traductions.

## Ordre de réalisation

1. **Dashboard en premier** : briques réutilisables, recommandation principale sourcée, onglets Recommandations / Détails, états A–H, navigation à quatre entrées et barre mobile. Garder les contrôles réellement appliqués par le serveur pendant la transition.
2. **Droits et quotas** : configuration centrale des trois offres, avis conservés par projet, contrôle de tous les chemins d’écriture, réservations concurrentes et enregistrement transactionnel des synthèses. Un échec ne consomme aucun quota. Rétrogradation sans suppression, projets excédentaires consultables.
3. **Avis / Ajout / Réglages** : recherche et filtres, détail latéral, édition des thèmes, suppressions, import avec aperçu et mapping, dédoublonnage texte/date, limites et notifications.
4. **Paiement** : quatre prix Stripe autorisés côté serveur ; Checkout `{ plan: pro | agency, interval: month | year }`, webhook signé et idempotent, portail et droits synchronisés. Aucun droit accordé par le retour Checkout.
5. **V1.1** : alertes (+5 avis et +50 % sur sept jours, période précédente nulle : cinq avis minimum, une alerte par thème/projet/sept jours), rapport Agence, catégorie Général/Boutique, exemple interactif local sans appel IA.
6. **Site public** : Produit / Exemple / Tarifs, aperçus statiques, animations complètes sur Produit, tarifs partagés, textes factuels, bande bêta et pages légales avec identité réelle de l’éditeur.
7. **Connexions et lancement** : état réel Supabase/Vercel/domaine/Resend/Gemini, migrations complémentaires uniquement, comparaison IA sur 40 avis, validation des parcours complets puis production.

## Interfaces et compatibilité

- Étendre l’usage avec capacités, compteurs par projet et prochaine synthèse manuelle possible.
- Chaque citation doit référencer un avis du même propriétaire et projet ; le lien « Voir les N » filtre exactement ces avis, y compris archivés.
- Conserver les anciens liens et statuts ; ne pas écraser les décisions lors d’une nouvelle synthèse.
- Ne pas tronquer silencieusement l’analyse à 300 avis : traitement par lots, agrégation sourcée et nombre d’avis analysés affiché.
- Préparer les migrations et présenter le SQL exact avant application distante. Ne pas rejouer les anciennes migrations destructrices.

## Vérification

Typecheck, lint, tests et build ; tests de propriété, quotas, concurrence, rollback et idempotence ; clavier, mobile, thèmes et mouvement réduit ; parcours inscription → avis → synthèse → décisions → paiement → droits → portail → rétrogradation ; widget, email, alertes, expiration et révocation des rapports.

Les achats restent fermés tant que Stripe et les fonctions payantes ne sont pas vérifiés. Une compilation réussie ne prouve pas les connexions ou la production.

## Suivi

Le document `QUALIO_LAUNCH.md` conserve le contenu intégral du document fourni, ses décisions mises à jour et une matrice d’avancement correspondant au code. Une tâche locale, une migration préparée, une migration appliquée et un service testé en production sont des états distincts.
