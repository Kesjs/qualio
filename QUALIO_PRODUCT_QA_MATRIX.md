# QUALIO PRODUCT QA MATRIX — AUDIT DE VALEUR RÉELLE

**Date de validation :** 26 Septembre 2026  
**Objectif :** Déterminer avec exactitude si les tests actuellement implémentés dans Qualio correspondent à ce qu'un client paie :  
> *"Vérifier qu'un site fonctionne après un changement ou un déploiement."*

---

## 1. INVENTAIRE EXHAUSTIF DES CHECKS

| Check | Fichier source | Condition testée | Résultat | Evidence produite | Impact utilisateur | Sévérité | Classification | Réellement exécuté | Testé | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`http_status`** | `src/lib/qa/browser/index.ts` | Code statut HTTP de la réponse de navigation | PASS: 200..399<br>FAIL: ≥400 | Code HTTP, URL finale, durée de réponse (ms) | Page inaccessible, 404 introuvable ou crash serveur 500 | `critical` | **CORE** | OUI (par page) | OUI (T01, T02, T03, Smoke) | **VALIDÉ** |
| **`console_errors`** | `src/lib/qa/browser/index.ts` | Erreurs JavaScript non interceptées via `page.on('console')` | PASS: 0<br>WARN: 1..2<br>FAIL: >2 | Messages d'erreurs, stack traces console, compte d'erreurs | Éléments interactifs cassés, logique frontend bloquée | `major` | **CORE** | OUI (par page) | OUI (T01, T04, T05) | **VALIDÉ** |
| **`forms_detected`** | `src/lib/qa/browser/index.ts` | Détection de formulaires HTML valides ou absence de formulaires | PASS | Nombre de formulaires identifiés | Informatif (validation globale de la présence de formulaires) | Aucun | **SUPPORTING** | OUI (par page) | OUI (T01) | **VALIDÉ** |
| **`form_no_submit`** | `src/lib/qa/browser/index.ts` | Formulaire présent sans bouton de soumission (`[type=submit]`) | WARN | Tag `<form>` sans bouton submit | L'utilisateur remplit le formulaire mais ne peut pas l'envoyer | `minor` | **CORE** | OUI (par form) | OUI (T06) | **VALIDÉ** |
| **`form_empty`** | `src/lib/qa/browser/index.ts` | Formulaire sans aucun champ de saisie (`fieldCount === 0`) | WARN | Formulaire vide | Formulaire orphelin ou bug d'affichage | `minor` | **SUPPORTING** | OUI (par form) | OUI | **VALIDÉ** |
| **`cta_detected`** | `src/lib/qa/browser/index.ts` | Présence d'un Call-to-Action (lien signup/contact, bouton CTA) | PASS: >0<br>WARN: 0 | Nombre d'éléments CTA trouvés dans le DOM | Absence de bouton de conversion / tunnel d'achat absent | `minor` | **CORE** | OUI (par page) | OUI (Smoke réel) | **VALIDÉ** |
| **`responsive_mobile`** | `src/lib/qa/browser/index.ts` | Débordement horizontal (`scrollWidth > clientWidth`) à 375px | PASS: pas de scroll<br>FAIL: débordement | Largeur clientWidth vs scrollWidth, durée | Site cassé sur mobile, texte tronqué, scroll horizontal indésirable | `major` | **CORE** | OUI (sur accueil) | OUI (Smoke réel) | **VALIDÉ** |
| **`responsive_tablet`** | `src/lib/qa/browser/index.ts` | Débordement horizontal (`scrollWidth > clientWidth`) à 768px | PASS: pas de scroll<br>FAIL: débordement | Largeur clientWidth vs scrollWidth, durée | Affichage cassé sur tablettes / iPad | `major` | **CORE** | OUI (sur accueil) | OUI (Smoke réel) | **VALIDÉ** |
| **`responsive_desktop`** | `src/lib/qa/browser/index.ts` | Débordement horizontal (`scrollWidth > clientWidth`) à 1440px | PASS: pas de scroll<br>FAIL: débordement | Largeur clientWidth vs scrollWidth, durée | Affichage dégradé sur grands écrans | `major` | **SUPPORTING** | OUI (sur accueil) | OUI (Smoke réel) | **VALIDÉ** |
| **`discovery_robots_sitemap`** | `src/lib/qa/discovery/index.ts` | Détection et parsing de `/robots.txt` et `/sitemap.xml` | PASS / NULL | URL sitemap extraite, contenu robots.txt | Exhaustivité de découverte des pages à auditer | Aucun | **SUPPORTING** | OUI (Phase 1) | OUI (Smoke réel) | **VALIDÉ** |
| **`internal_crawler`** | `src/lib/qa/crawler/index.ts` | Crawl récursif des liens internes (same origin, dédupliqués) | PASS / FAIL | Liste des URLs découvertes, temps de réponse, titres | Détection des pages orphelines ou liens internes morts | `major` | **CORE** | OUI (Phase 2) | OUI | **VALIDÉ** |
| **`screenshot_capture`** | `src/lib/qa/browser/index.ts` | Prise de capture d'écran Playwright en pleine résolution | PASS: Buffer PNG | Buffer PNG binaire | Preuve visuelle irréfutable pour le client | Aucun | **SUPPORTING** | OUI | OUI (Smoke réel) | **VALIDÉ** |
| **`parcours_a_conversion`** | `scripts/validate_user_journeys.ts` | Tunnel complet : Home → Pricing → CTA → Contact → Submit → Confirmation | PASS: 6/6 étapes | HTTP 200, URL, Navigation, Saisie DOM, POST 303, Message succès, Screenshot | Garantit que le tunnel de génération de leads / démo fonctionne | `critical` | **CORE** | OUI (Suite E2E) | OUI (100% PASS) | **VALIDÉ** |
| **`parcours_b_auth`** | `scripts/validate_user_journeys.ts` | Tunnel complet : Home → Login → Formulaire → Submit → Redirect Dashboard | PASS: 5/5 étapes | HTTP 200, Navigation, Saisie sécurisée, POST 303, Vérification session Dashboard | Garantit que la connexion client n'est pas bloquée après déploiement | `critical` | **CORE** | OUI (Suite E2E) | OUI (100% PASS) | **VALIDÉ** |
| **`parcours_c_mobile_nav`** | `scripts/validate_user_journeys.ts` | Mobile : Home 375px → Burger menu toggle → Pricing → CTA click | PASS: 4/4 étapes | Viewport 375px, Classe DOM `.open`, Navigation, Action CTA | Garantit que l'expérience mobile essentielle fonctionne | `major` | **CORE** | OUI (Suite E2E) | OUI (100% PASS) | **VALIDÉ** |
| **`parcours_d_checkout`** | `scripts/validate_user_journeys.ts` | Tunnel d'achat : Panier → Clic validation simulation → Feedback validé | PASS: 4/4 étapes | DOM Panier, Déclenchement non-destructif, Validation visuelle | Vérifie le déclencheur d'achat sans débit de carte bancaire réelle | `critical` | **CORE** | OUI (Suite E2E) | OUI (100% PASS) | **VALIDÉ** |

---

## 2. VÉRIFICATION DU CHIFFRE "42+ CHECKS"

### Le constat technique sans concession
Le chiffre **"42+"** affiché sur la landing page est une **métrique marketing de volume d'exécution**, et **NON un ensemble de 42 règles ou algorithmes de test distincts dans le code**.

* **Combien de checks existent réellement dans le code ?**
  * **9 checks atomiques** dans `BrowserEngine` (`http_status`, `console_errors`, `forms_detected`, `form_no_submit`, `form_empty`, `cta_detected`, `responsive_mobile`, `responsive_tablet`, `responsive_desktop`).
  * **2 vérifications de découverte** dans `DiscoveryEngine` (`robots.txt`, `sitemap.xml`).
  * **4 parcours utilisateurs complets** dans le runner de parcours (Parcours A, B, C, D).
  * **Total réel dans le code : 15 vérifications fonctionnellement distinctes**.
* **D'où vient le "42+" ?**
  * Lors d'un scan multi-pages classique (ex: un site avec 10 pages découvertes) :
    $$\text{Total exécuté} = (10 \text{ pages} \times 4 \text{ tests/page}) + 3 \text{ viewports responsive} + 2 \text{ tests discovery} = 45 \text{ vérifications exécutées}.$$
  * C'est donc le **nombre de points de contrôle exécutés au cours d'un scan standard**, et non un catalogue de 42 heuristiques différentes.
* **Combien de sous-conditions d'autres checks ?**
  * `form_no_submit` et `form_empty` sont des sous-branches de `testForms`.
  * `responsive_mobile`, `responsive_tablet`, `responsive_desktop` sont des itérations paramétrées de la boucle de viewports dans `testResponsive`.
* **Combien de problèmes distincts perçus par l'utilisateur ?**
  * **7 catégories d'incidents distinctes** :
    1. Page inaccessible / Erreur HTTP (404, 500, network error)
    2. Erreurs d'exécution JavaScript dans la console
    3. Formulaire défectueux ou sans bouton de soumission
    4. Absence de Call-to-Action (CTA) visible
    5. Débordement horizontal sur mobile (375px)
    6. Débordement horizontal sur tablette (768px)
    7. Rupture d'un parcours de conversion (Lead, Auth, Checkout)

---

## 3. CORE CHECKS RÉELLEMENT VALIDÉS

Les tests essentiels à la promesse Qualio validés par le code et les tests automatisés :
1. ✅ **Page Availability & HTTP Status :** Capture immédiate des 404, 500, et codes d'erreur serveur avec sévérité `critical`.
2. ✅ **Console & JavaScript Errors :** Capture en temps réel des erreurs `TypeError`, scripts non chargés, crashes runtime.
3. ✅ **Broken Form & Missing Submit :** Détection des formulaires orphelins incapables d'être soumis par l'utilisateur.
4. ✅ **CTA Detection :** Détection de l'absence de boutons d'action clés de conversion.
5. ✅ **Responsive Layout & Mobile Overflow :** Détection des débordements horizontaux à 375px et 768px (`scrollWidth > clientWidth`).
6. ✅ **Corrélation d'incidents & Déduplication :** Compression de 40 événements bruts en incidents uniques sans spam pour le développeur.
7. ✅ **Tunnels de conversion critiques (Parcours A, B, C, D) :** Validation Playwright de bout en bout avec soumissions et redirections.

---

## 4. CORE CHECKS MANQUANTS DANS L'ORCHESTRATEUR CENTRAL

Bien que validés dans la suite `validate_user_journeys.ts`, les vérifications suivantes ne sont pas encore branchées par défaut dans le crawl autonome de `QAOrchestrator.runScan` :
1. ⚠️ **Exécution automatique de multi-step flows :** `QAOrchestrator` teste actuellement les pages individuellement ; les parcours multi-pages (clic lien → formulaire → redirection) doivent être déclarés ou inférés.
2. ⚠️ **Remplissage automatique intelligent de formulaires (Smart Form Fill) :** Actuellement le crawler inspecte les balises de formulaire, mais n'envoie pas de données fictives automatiquement lors d'un scan standard (seule la suite de parcours dédiée le fait).
3. ⚠️ **Performance Web Vitals (LCP, CLS, FID/INP) :** Non calculés dans les checks actuels (seul le `duration_ms` brut de chargement est mesuré).
4. ⚠️ **Détection de balises SSL / Mixed Content :** Non testé explicitement (`ignoreHTTPSErrors: true` est actuellement actif dans le navigateur).

---

## 5. CHECKS NON ESSENTIELS / DE SECOND RANG

1. ℹ️ **`form_empty` :** Utile pour les développeurs, mais peu impactant pour l'acheteur final si la page fonctionne.
2. ℹ️ **`responsive_desktop` (1440px) :** Rarement source de régression critique par rapport au mobile (375px).
3. ℹ️ **`forms_detected` (PASS) :** Simple confirmation informative qui n'apporte pas de valeur de diagnostic d'erreur.

---

## 6. PARCOURS UTILISATEURS COMPLETS (RÉSULTATS DE VALIDATION)

Exécutés via `scripts/validate_user_journeys.ts` avec Playwright Chromium en headless :

* **Parcours A (Lead & Demo Flow) :**
  * *Étapes :* Homepage (HTTP 200) → Clic Tarifs → Clic CTA Démo → Remplissage Nom/Email → Soumission POST (303) → Bannière de confirmation affichée.
  * *Résultat :* **PASS** (6/6 étapes en 2 836 ms) — 7 preuves collectées (HTTP, DOM, Réseau, Screenshot de 9 671 octets).
* **Parcours B (Auth & Dashboard Flow) :**
  * *Étapes :* Homepage → Clic Se connecter → Saisie identifiants mockés → POST 303 → Redirection vers `/dashboard` → Message de bienvenue validé.
  * *Résultat :* **PASS** (5/5 étapes en 1 318 ms) — 5 preuves collectées.
* **Parcours C (Navigation Mobile Responsive) :**
  * *Étapes :* Homepage en viewport 375x812 → Clic burger menu → Menu déroulé → Clic sur lien Tarifs → Clic CTA Offre Pro → Statut confirmé.
  * *Résultat :* **PASS** (4/4 étapes en 1 178 ms) — 4 preuves collectées.
* **Parcours D (Checkout Non-Destructif) :**
  * *Étapes :* Panier démo → Vérification article → Clic validation simulée → Statut commande validée sans débit bancaire.
  * *Résultat :* **PASS** (4/4 étapes en 858 ms) — 4 preuves collectées.

---

## 7. VÉRIFICATION DU FONCTIONNEMENT SANS IA

* **Indépendance totale du moteur :** En cas d'indisponibilité totale du provider IA (timeout, 429, coupure réseau, pas de clé API) :
  * Les checks Playwright continuent d'analyser le site à 100%.
  * Les statuts `passed`, `warning`, `failed` sont déterminés de manière purement déterministe.
  * Les incidents sont créés et stockés dans Supabase avec leurs preuves brutes.
  * Le résumé global (`generateSummary`) est calculé directement à partir du nombre de bugs critiques/majeurs détectés par Playwright.
  * L'IA n'est **JAMAIS** un point de défaillance unique (Single Point of Failure).

---

## 8. MESURE DU SMOKE TEST RÉEL GEMINI (1 SEUL APPEL RÉEL)

Exécuté sur un cas réel d'erreur HTTP 404 (visite de `https://httpbin.org/status/404`) :

* **Provider :** `gemini`
* **Modèle :** `gemini-3.8-flash`
* **Durée de l'appel :** 8 357 ms
* **Input Tokens :** 441 tokens
* **Output Tokens :** 199 tokens
* **Total Tokens :** 640 tokens
* **Coût mesuré :** **$0.000093** (inférieur à 1 centime pour 100 diagnostics)
* **Succès du diagnostic :** **OUI**
* **Validation anti-hallucination :** **100% SUCCÈS** (tous les IDs de preuve retournés par Gemini correspondent strictement aux faits observés par Playwright).
* **Diagnostic produit :**
  * *Titre :* `PAGE INTROUVABLE (ERREUR HTTP 404)`
  * *Résumé :* `La page demandée a retourné un statut HTTP 404 lors du test de navigation.`
  * *Cause probable :* `La ressource ciblée semble avoir été déplacée, supprimée ou l'URL appelée pourrait comporter une erreur de routage.`
  * *Recommandation :* `Vérifier la configuration du serveur web, les règles de routage et l'existence effective de la ressource ciblée.`
  * *Sévérité :* `critical`
  * *Confiance :* `0.95`

---

## 9. VALIDATION DU MOCK AI (TESTS DÉTERMINISTES)

La suite de tests unitaires Vitest valide **20 tests sur 20** (100% PASS en 3.75s) :
1. ✅ **Valid diagnostic** (T01 & Test 1)
2. ✅ **Invalid JSON** (T09)
3. ✅ **Fake evidence ID rejection** (T08 & Test 3 — Zero hallucination)
4. ✅ **Missing probable cause** (Test 2 — `probable_cause = null` lorsque les preuves sont insuffisantes)
5. ✅ **Invalid confidence** (T16 — Normalisation stricte de la confiance dans l'intervalle [0, 1])
6. ✅ **Timeout** (T17 — Rejet propre sans crash ni rejet non géré)
7. ✅ **429 / 500 error** (T10 — Gestion résiliente des quotas et pannes d'API)
8. ✅ **Prompt injection** (T15 — Les directives malveillantes injectées dans le DOM ou la console ne contournent pas les règles métier)

---

## 10. SMOKE TEST SUR SITE PUBLIC RÉEL (READ-ONLY)

Exécuté sur `https://example.com` (domaine public RFC 2606) :
* **Découverte :** Analyse robots.txt et sitemap.xml terminée sans blocage.
* **Navigation :** Statut HTTP 200 en 773 ms.
* **Console :** 0 erreur JavaScript.
* **CTA Check :** Détection de l'absence de CTA (`[WARNING] No clear CTA found on page`).
* **Responsive Multi-Viewport :** 0 débordement horizontal vérifié à 375px (mobile), 768px (tablette) et 1440px (desktop).
* **Capture de Preuve :** Screenshot PNG de 12 091 octets capturé avec succès.
* **Bilan :** 6 checks exécutés, 5 Passed, 1 Warning, 0 Failed, 0 incident critique.

---

## 11. BASE DE DONNÉES & MIGRATIONS SUPABASE

* **Migrations inspectées :**
  1. `20260925194500_qualio_schema_v2.sql` : Création des tables `profiles`, `sites`, `scans`, `pages`, `checks`, `issues`, `evidence`, `screenshots`.
  2. `20260926120000_qualio_add_ai_metrics.sql` : Ajout des colonnes de suivi IA (`ai_tokens_input`, `ai_tokens_output`, `ai_cost_usd`, `ai_duration_ms`, `ai_model`, `ai_calls_count`).
* **Correspondance Schéma / Code :** **100% aligné.** Aucune nouvelle table n'est nécessaire.
* **RLS (Row Level Security) :** Actif sur toutes les tables avec isolation par `auth.uid() = user_id` ou via sous-requête sur `scans`.

---

## 12. PROTECTION DES ROUTES TEST-ONLY & SÉCURITÉ

* **Route `/api/mock-test-site/[scenario]` :**
  * Sécurisée : un garde conditionnel bloque systématiquement l'accès en production (`process.env.NODE_ENV === 'production'`) et retourne un code HTTP 404, sauf si explicitement activé via `ENABLE_TEST_ROUTES=true`.
* **Fichiers secrets & Git :**
  * `.env*` est présent dans `.gitignore`.
  * La commande `git ls-files .env*` confirme que **0 fichier `.env` n'est suivi par Git**.
  * Aucune clé API n'est codée en dur dans le dépôt.

---

## SYNTHÈSE GLOBALE POUR LE PRODUIT

| Question Produit | Réponse Qualio |
| :--- | :--- |
| **Le produit répond-il à la promesse client ?** | **OUI.** Un changement introduisant une 404, une erreur 500, un crash JavaScript, un formulaire sans bouton d'envoi ou un site cassé sur mobile est détecté, catégorisé avec preuve et notifié. |
| **Le slogan "42+ checks" est-il trompeur ?** | **Oui si présenté comme 42 règles différentes.** Il correspond en réalité au volume cumulé d'exécutions sur un crawl multi-pages standard (10 pages × 4 checks + 3 viewports = 45 tests). En code, il existe **15 vérifications fonctionnellement distinctes**. |
| **Le pipeline fonctionne-t-il sans IA ?** | **OUI.** L'analyse Playwright est 100% autonome. L'IA n'apporte qu'un enrichissement rédactionnel (synthèse et recommandation). |
| **L'IA hallucine-t-elle ?** | **NON.** La règle de validation stricte rejette tout diagnostic IA référençant des preuves non observées par Playwright. |
