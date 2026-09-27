# Audit produit et état de livraison — Qualio

Date : 27 septembre 2026  
Statut : audit de cadrage, fondé sur le code et l’architecture actuelle.

## Synthèse

Qualio a une proposition claire : une plateforme de QA continue qui vérifie un site après un déploiement, explique les incidents observés et permet de vérifier les corrections au scan suivant.

L’idée produit et la landing page sont convaincantes. Le produit est toutefois, à ce stade, un MVP avec une interface avancée et un moteur de scan partiellement intégré. La priorité est de rendre fiable le parcours central avant d’élargir la promesse commerciale.

## À quoi sert Qualio

Qualio répond à la question : « Nous venons de déployer : est-ce que les parcours importants fonctionnent toujours ? »

Le cycle cible est :

```text
Ajouter un site
→ lancer un scan
→ parcourir, cliquer et tester
→ collecter les preuves
→ regrouper les incidents
→ diagnostiquer avec l’IA
→ corriger
→ re-scanner
→ comparer et vérifier
```

Le positionnement ne consiste pas à produire un score Lighthouse ou un rapport statique. Qualio doit détecter les ruptures fonctionnelles concrètes — CTA inactif, formulaire bloqué, checkout inaccessible, lien mort ou régression mobile — et les relier à leur impact utilisateur et métier.

## Ce qui est déjà fait

- Authentification, sites et scans persistés dans Supabase.
- Moteur de crawl et tests de navigation, formulaires, CTA et responsive.
- Evidence Engine qui regroupe les signaux avant analyse.
- Diff Engine pour qualifier les incidents `new`, `persistent` et `resolved`.
- Diagnostic IA structuré : sévérité, impact, cause probable, recommandation et niveau de confiance.
- Base de persistance pour les parcours utilisateur et les captures en cas d’échec.
- Dashboard avec les bons objets métier : sites, scans, bugs, preuves, captures et historique.

## Écarts critiques entre promesse et exécution

### 1. Le démarrage d’un scan ne lance pas encore forcément le scan

La route `POST /api/scan/start` crée un scan au statut `created`. L’exécution est censée être déclenchée ensuite par un cron GitHub Actions qui appelle `POST /api/scan/run`.

Le dépôt ne contient actuellement pas de workflow GitHub Actions. Sans déclencheur externe effectivement configuré, un utilisateur peut lancer un scan dans l’interface sans que le traitement démarre.

### 2. Risque de double création de scan

La route de démarrage crée une première ligne de scan. L’orchestrateur recrée ensuite lui-même une ligne lorsqu’il exécute `runScan`. Le scan affiché à l’utilisateur peut alors être différent du scan réellement traité.

Le système doit exécuter le scan déjà créé, avec le même `scanId`, plutôt que d’en créer un deuxième.

### 3. Les options visibles du modal ne configurent pas encore le moteur

Le modal présente des modules de test — pages, CTA, formulaires, console et mobile — mais les sélections ne sont pas encore transmises au moteur. La profondeur de scan et les options doivent devenir des paramètres réels de l’exécution.

### 4. Les journeys ne font pas encore partie du flux de scan standard

Les parcours utilisateur et leurs captures sont présents dans le code, mais l’intégration principale est encore présentée comme un exemple. Ils doivent être branchés à l’orchestrateur pour faire partie d’un scan normal.

### 5. Preuves visuelles non garanties pour chaque scan standard

Les captures sont supportées pour les parcours en échec, mais le flux de scan standard ne garantit pas encore la création systématique d’une preuve visuelle exploitable pour chaque incident.

### 6. Fallbacks mock dans des écrans opérationnels

Certaines pages affichent des données de démonstration quand une API échoue ou ne retourne aucune donnée. Pour une plateforme de QA, cela risque de présenter des bugs, scans ou métriques fictifs comme s’ils étaient réels.

Les fallbacks mock doivent être remplacés par des états vides et des états d’erreur explicites en production.

### 7. Protection SSRF à durcir

La validation d’URL bloque certains hôtes privés, mais elle ne couvre pas correctement tous les cas d’adresses locales ou privées. Elle doit inclure une résolution DNS contrôlée, puis le blocage des IP privées, loopback, link-local et metadata après résolution.

## Analyse de la landing page

### Points forts

- Direction technique sombre cohérente avec une audience de développeurs.
- Le hero explique bien les trois promesses : scan, diagnostic IA et historique.
- Les panneaux démontrent visuellement le problème, son explication et sa résolution.
- Le CTA avec champ URL correspond au moment d’activation attendu.
- La page possède une identité visuelle distincte et non générique.

### Points à corriger

1. Les données de démonstration réalistes doivent être marquées clairement comme des exemples ou une démo.
2. La landing présente des comportements qui ne sont pas encore garantis : scan immédiat, preuves visuelles systématiques, re-scan et historique pleinement fiables.
3. Le champ URL laisse entendre qu’un scan part immédiatement, alors qu’il dirige actuellement vers l’inscription ou le dashboard. Le message doit annoncer clairement cette étape, ou le produit doit proposer une vraie pré-analyse publique limitée.
4. Les langues doivent rester cohérentes sur l’ensemble du tunnel : landing, inscription et dashboard.

## Analyse du dashboard

### Points forts

- Hiérarchie naturelle : Sites → Scans → Bugs → Preuves.
- Le consentement avant scan est une bonne mesure de sécurité et de clarté.
- Les sévérités, recommandations et preuves sont compréhensibles.
- Le détail d’un parcours avec son étape en échec constitue une fonctionnalité différenciante.

### Défaut de confiance à traiter

Les données mock utilisées comme fallback doivent disparaître des surfaces opérationnelles. L’utilisateur doit toujours savoir si les données sont réelles, absentes ou indisponibles.

> Note de décision : le choix d’un dashboard clair/sombre et ses conventions visuelles est volontaire. Il ne fait pas partie des problèmes à corriger dans cet audit.

## Analyse backend

L’architecture cible est pertinente :

```text
Playwright → Evidence Engine → Diff Engine → IA → Supabase → Dashboard
```

Les choix structurants sont bons : Playwright reste la source de vérité, l’IA interprète les preuves plutôt qu’elle n’invente des incidents, et le diff est déterministe.

La dette principale est l’orchestration : le scan doit être réellement planifié, exécuté, suivi et repris de manière fiable. Un traitement long ne doit pas reposer sur un appel HTTP fragile sans mécanisme de worker, de queue ou de planification contrôlée.

## Priorités de livraison

1. Déclencher chaque scan créé et réutiliser son `scanId` du début à la fin.
2. Mettre en place un worker, une queue ou un scheduler réellement déployé.
3. Faire respecter les modules et la profondeur sélectionnés dans le modal.
4. Intégrer les journeys dans le flux standard.
5. Associer systématiquement les preuves, dont les captures lorsque nécessaire, aux incidents.
6. Remplacer les données mock de production par des états vides et d’erreur honnêtes.
7. Durcir la validation d’URL contre le SSRF.
8. Ajouter un cycle de statut fiable : `created → queued → running → completed | failed`, avec timeout et reprise.

## Objectif de validation produit

Avant d’augmenter la communication ou le trafic, Qualio doit démontrer ce flux réel :

> Un utilisateur ajoute une URL, lance un scan, suit son exécution, reçoit de vrais incidents avec preuves, corrige un problème, puis voit au re-scan ce qui a été résolu ou régressé.

Quand ce parcours est fiable, la promesse de la landing devient concrète sans nécessiter de refonte visuelle majeure.
