# Priorités d’automatisation de Qualio

Ce document fixe les trois priorités qui doivent guider l’évolution de l’automatisation de Qualio.

## 1. Déclencher les scans automatiquement

Qualio ne doit pas dépendre d’un utilisateur qui pense à lancer un scan.

Déclencheurs à prendre en charge, dans cet ordre :

- scan planifié : horaire, quotidien ou hebdomadaire ;
- scan après un déploiement ;
- webhook GitHub ou Vercel ;
- scan manuel depuis le dashboard, conservé comme option de secours.

Objectif produit : après un déploiement, Qualio vérifie automatiquement les parcours critiques du site.

## 2. Détecter, comparer et vérifier automatiquement

Après chaque exécution, Qualio doit transformer les résultats en actions compréhensibles :

- détecter les nouveaux problèmes ;
- comparer avec le scan précédent ;
- distinguer les problèmes nouveaux, persistants, intermittents et corrigés ;
- relancer automatiquement un re-test après une nouvelle version ;
- confirmer qu’une correction fonctionne réellement ;
- éviter les doublons d’issues.

Objectif produit : fermer la boucle « problème détecté → correction → vérification ».

## 3. Notifier et décider si la release est sûre

Qualio doit fournir une décision claire, et pas seulement une liste de métriques :

- notifications email en premier ;
- Slack, Discord et webhooks ensuite ;
- statut **Prêt**, **À vérifier** ou **Bloqué** ;
- score de confiance basé sur les preuves ;
- possibilité de bloquer une release si un parcours critique échoue ;
- rapport partageable contenant les étapes, erreurs et screenshots.

Objectif produit : permettre à une équipe de savoir immédiatement si elle peut publier.

## Résumé de la boucle cible

```text
Déploiement
    ↓
Scan automatique
    ↓
Détection et comparaison
    ↓
Notification
    ↓
Correction
    ↓
Re-test automatique
    ↓
Validation ou blocage de la release
```

## Ordre de réalisation recommandé

1. Scans planifiés + re-test + comparaison entre scans.
2. Notifications email + intégrations webhook/GitHub/Vercel.
3. Release confidence + release gate + rapports partageables.

Ces trois priorités sont suffisantes pour construire la promesse centrale de Qualio :

> Surveiller les parcours critiques après chaque déploiement, expliquer les régressions et vérifier automatiquement les corrections.
