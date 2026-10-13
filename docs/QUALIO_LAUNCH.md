# Qualio — Document de lancement V1

**Statut : version de travail 1.7, mise à jour le 13 octobre 2026.** Le lancement validé inclut Gratuit, Pro et Agence ainsi que V1 + V1.1. Les spécifications décrivent la cible ; la matrice ci-dessous décrit le code réellement présent.

Un seul document : décisions produit, dashboard, landing, offres, et tout ce qu'il faut connecter pour mettre en ligne.
Les points marqués **(proposé)** sont des valeurs par défaut que j'ai choisies pour ne rien laisser ouvert. Les points marqués **(à vérifier)** dépendent de ton compte ou de ton pays et je n'ai pas pu les confirmer.

---

## Suivi du code — 13 octobre 2026

Ce document conserve tous les chapitres du fichier fourni. **Les spécifications décrivent la cible ; elles ne signifient pas que les fonctions sont livrées.** Les décisions de lancement commun remplacent les anciennes mentions de V1.1 « juste après » dans les chapitres historiques.

Plan enregistré : [QUALIO_LAUNCH_PLAN.md](./QUALIO_LAUNCH_PLAN.md).

| Chapitre | État du code / travail restant |
|---|---|
| 0 — Périmètre | Gratuit, Pro et Agence ensemble, après validation de Stripe et des fonctions payantes. Agence pas encore implémentée. |
| 1 — Positionnement | Promesse conservée ; textes publics à vérifier contre les fonctions réellement connectées. |
| 2 — Offres | À réaliser : 50 / 2 000 / 10 000 avis conservés, quotas 14 jours / quotidien, réservations concurrentes, Agence, suppression des nouveaux essais et rétrogradation. Le code applique encore 500 / 5 000 avis mensuels et 1 / 12 synthèses mensuelles. |
| 3.1–3.3 — Accueil | Nouveau premier lot local : Cette semaine, Recommandations / Détails, recommandation principale, trois citations maximum, lien vers les avis exacts, Accepter / Plus tard / Écarter et suivantes compactes. |
| 3.3 — États A–H | Démo fictive locale, échauffement, première génération, chargement, erreur et quota actuel. Délai de 14 jours et limite V1 attendent le lot serveur. |
| 3.3 — Détails | Compteurs, huit semaines de volume, sujets et variation sur sept jours, historique Pro et bloc verrouillé Gratuit. |
| 3.4 — Avis | Liste, recherche, filtres, détail et édition présents ; filtre exact par recommandation ajouté, archivés inclus. Suppression groupée et liens inverse avis → recommandations à compléter. |
| 3.5 — Ajout | CSV, saisie et widget présents ; mapping, aperçu cinq lignes, dédoublonnage et nouveaux quotas à compléter. |
| 3.6 — Réglages | Compte/notifications présents ; secteur, trois offres, quotas et clôture abonnement avant suppression à compléter. |
| 3.7–3.9 — Briques | Carte, boutons, bandeau, progression, onglets, état vide et recommandation ajoutés avec tokens existants. Quatre entrées de navigation, barre mobile, en-tête projet/plan. Réutilisation sur les autres écrans à poursuivre. |
| 4 — Landing | Conservée ; navigation Produit/Exemple/Tarifs, trois offres, sections, FAQ, arrondis et animations à aligner. Hero préservé. |
| 5.1 — Supabase | Routes/migrations existantes ; état distant à auditer. Migrations complémentaires seulement, SQL exact à présenter avant application distante. Ne pas rejouer les 32 migrations. |
| 5.2 — Stripe | Checkout/webhook/statut/portail Pro mensuel présents. Compte marchand à vérifier ; quatre prix, Agence et annuel à ajouter. Aucun encaissement réel vérifié dans ce lot. |
| 5.3 — Resend | Envoi/webhook/désabonnement présents ; domaine, délivrabilité, reprises et emails multi-projets à vérifier. |
| 5.4 — IA | Adaptateurs présents ; configuration réelle et modèles à vérifier, comparaison sur 40 avis. Échantillonnage actuel de 300 avis à remplacer ou expliciter. |
| 5.5–5.6 — Vercel | Cron lundi 08:00 UTC présent ; déploiement et variables distantes non vérifiés. Prix annuels/Agence et cron d’alertes à ajouter. |
| 5.7 — Légal/contact | Contact présent ; pages légales et identité réelle de l’éditeur à préparer. |
| 5.8 — Suivi | Logs/coûts IA présents ; alertes opérationnelles, sauvegardes et suivi hebdomadaire à vérifier. |
| 6 — Code | Dashboard en premier, puis droits/quotas, Avis/Ajout/Réglages, paiement, V1.1, marketing et connexions. Voir plan enregistré. |
| 7 — Mise en ligne | Non effectuée dans ce lot. Validation locale distincte du parcours authentifié distant. |
| 8 — V1.1 | Incluse au lancement, à implémenter : alertes Pro/Agence, rapport Agence, thèmes boutique et exemple interactif. PDF, nouvelles intégrations, multiutilisateur et application native exclus. |
| 9 — Externe | Stripe à vérifier, sans création automatique de société. Inspecter le domaine existant avant achat. Gemini retenu sous réserve de validation réelle. |

### Particularités et limites du premier lot dashboard

- Le report utilise les colonnes existantes : status=open et decided_at renseigné. La recommandation descend derrière les non reportées et garde son report après rechargement.
- Les citations et le filtre des sources contrôlent le propriétaire et le projet. Les avis archivés restent consultables via le lien des sources.
- La démonstration est fictive et étiquetée ; elle n’est jamais insérée en base ni envoyée à l’IA. Les anciens avis d’exemple éventuellement stockés restent des données existantes à traiter dans le lot quotas.
- L’en-tête affiche les avis conservés sans comparer artificiellement ce nombre aux nouveaux quotas non appliqués.
- Les limites mensuelles réellement appliquées restent visibles. Le nouveau délai Gratuit de 14 jours ne doit pas être annoncé comme fonctionnel.
- Motif d’écartement, historique immuable, contrôle serveur de l’accès à l’historique, lecture exhaustive des grands volumes et contrôle distribué de génération restent à réaliser.
- État du code constaté localement ; aucun service distant, paiement réel ou déploiement certifié par ce document.

### Validation de ce lot

Validation en cours : typecheck, tests, lint, build et inspection du rendu. Une vérification avec données simulées ne vaut pas un parcours connecté à la base réelle.

---

## 0. Périmètre du lancement (décision actualisée)

**Lancement commun : Gratuit, Pro et Agence, avec toutes les fonctions V1 + V1.1.**

| Capacité | Cible au lancement |
|---|---|
| Cette semaine, quatre entrées de navigation, démonstration | Toutes les offres |
| CSV et saisie | Toutes les offres |
| Widget, email du lundi, historique et alertes de hausse | Pro et Agence |
| Rapport partageable | Agence |
| Thèmes Général / Boutique | Création et réglages des projets |
| Page Exemple | Démonstration interactive sans compte |

**Condition d’ouverture :** vérifier les encaissements Stripe et les fonctions payantes avant le lancement commun. Pendant la préparation, aucun bouton d’achat ne doit donner accès à une offre non configurée. La solution de repli « Gratuit d’abord, Me prévenir pour Pro » du document 1.6 n’est plus le scénario de lancement retenu.

---

## 1. Positionnement

- **Promesse** : « Quoi faire cette semaine » — une recommandation sourcée, avec les avis qui la justifient.
- **Cœur du produit** : la recommandation sourcée (chaque conseil se vérifie dans les vrais avis).
- **Publics** : équipes produit, agences / freelances, boutiques en ligne. Un seul produit, trois façons de l'utiliser.
- **Concurrence** : les outils comparables coûtent de l'ordre de 1 000 $/mois et plus, ou sont gratuits mais limités. Qualio occupe l'espace du petit volume à petit prix.
- **Vrai concurrent** : le chat IA gratuit où l'on colle ses avis. Réponse du produit : le suivi dans le temps (widget continu, email du lundi, historique des décisions).
- **Règle de vérité** : rien n'est écrit sur la landing ou la page tarifs si la fonction n'est pas branchée.
- **Place de l'IA** : on vend le résultat, pas la technologie. L'IA est mentionnée une seule fois, dans la description du produit.

---

## 2. Offres, prix et limites

### 2.1 V1

| | **Gratuit** | **Pro** |
|---|---|---|
| Mensuel | 0 € | 19 € |
| Annuel (2 mois offerts) | — | 190 € |
| Projets | 1 | 5 **(proposé : valeur déjà dans le code, adaptée aux freelances ; coût d'IA à vérifier)** |
| Avis par projet | 50 | 2 000 **(proposé, à ajuster selon ton coût d'IA)** |
| Recommandations de la semaine | 1 synthèse manuelle toutes les 14 jours | Automatique chaque semaine + 1 synthèse manuelle par jour et par projet **(proposé)** |
| Import CSV et ajout manuel | Oui | Oui |
| Widget en continu | Non | Oui |
| Email du lundi | Non | Oui |
| Historique des décisions | Non | Oui |
| Carte bancaire pour créer le compte | Non | Oui, au moment de s'abonner |

### 2.2 Agence (incluse au lancement commun)

| | **Agence** |
|---|---|
| Mensuel | 49 € |
| Annuel | 490 € |
| Projets | 15 |
| Avis par projet | 10 000 **(proposé)** |
| Tout le Pro, plus | Rapport partageable avec nom du client, alerte « un thème monte » |

L'alerte « un thème monte » est incluse dans Pro et Agence au lancement commun.

### 2.3 Règles décidées

- **Gratuit à vie** : aucun compte gratuit n'est supprimé pour inactivité. Le coût reste borné par 1 projet, 50 avis et 1 synthèse toutes les 14 jours.
- **Pas de carte bancaire** pour le gratuit. La ligne « carte bancaire » n'apparaît plus dans le tableau des prix.
- **Un compte gratuit par adresse email.** Les limites s'appliquent à chaque compte.
- **Suppression des nouveaux essais Pro : validée.** Les essais existants sont honorés jusqu’à leur échéance. Le Gratuit joue le rôle d'essai, limité par l'usage. Le code a aujourd'hui un essai Pro de 14 jours sans carte, qui est à retirer.
- **Mensuel et annuel côte à côte**, avec la remise de 2 mois offerts.
- **Synthèse échouée** : jamais comptée dans le quota.
- **Rétrogradation Pro vers Gratuit** : rien n'est supprimé. Ce qui dépasse la limite passe en lecture seule jusqu'à retour sous la limite.
- **Une limite ne bloque jamais la lecture** des données déjà présentes.
- **Plusieurs utilisateurs par compte** : non inclus dans la V1 (à vérifier si l'application le gère, sinon à ne pas afficher).

### 2.4 Affichage des limites

- Sous 80 % : barre neutre.
- À partir de 80 % : barre orange et « Vous approchez de la limite ».
- À 100 % : barre rouge, l'action bloquée est grisée avec la raison et le bouton « Passer à Pro ».

---

## 3. Dashboard

### 3.1 Principes

1. Un écran = une décision.
2. Le dashboard s'adapte à l'état du compte, jamais d'écran vide sans « quoi faire ensuite ».
3. Une fonction d'un plan supérieur est visible avec un cadenas et une phrase claire, jamais cachée.
4. Vocabulaire simple : « recommandation », « avis ». Le mot « thème » seulement dans les filtres.
5. Le plan et l'usage sont toujours visibles.

### 3.2 Structure

**Barre latérale, 4 entrées** : Cette semaine · Avis · Ajouter des avis · Réglages. Sur mobile, elle devient une barre en bas.

**En-tête sur tous les écrans** :
- Sélecteur de projet à gauche. Le bouton « Nouveau projet » est grisé avec un cadenas si la limite du plan est atteinte.
- Pastille de plan à droite (Gratuit ou Pro).
- Compteur d'usage discret : « 32 / 50 avis ».
- Bouton « Passer à Pro » visible seulement en Gratuit.

### 3.3 Écran « Cette semaine » (accueil)

Deux onglets : **Recommandations** (par défaut) et **Détails**.

```
┌────────────────────────────────────────────────────────────┐
│ RECOMMANDATION N°1                         Priorité haute  │
│ Rendre la facturation visible dans le menu                 │
│ 14 avis sur 40 mentionnent la difficulté à retrouver       │
│ leurs factures.                                            │
│                                                            │
│ ▸ « Je n'arrive jamais à retrouver ma facture » — 12/10    │
│ ▸ « Où sont les factures ? » — 09/10                       │
│ ▸ « Facturation introuvable » — 03/10        [Voir les 14] │
│                                                            │
│ [ Accepter ]   [ Plus tard ]   [ Écarter ]                 │
├────────────────────────────────────────────────────────────┤
│ AUTRES RECOMMANDATIONS                                     │
│ 2. Réduire le délai de livraison annoncé       · 9 avis    │
│ 3. Ajouter le paiement mobile                  · 7 avis    │
│ 4. Clarifier la politique de retour            · 5 avis    │
├────────────────────────────────────────────────────────────┤
│ Synthèse du 13/10 · [ Actualiser ]  Prochaine possible :   │
│ 27/10 (Gratuit)                                            │
└────────────────────────────────────────────────────────────┘
```

**Blocs**
- **Recommandation n°1** : titre court, une phrase avec le chiffre (« X avis sur Y »), 3 avis cités maximum avec leur date, lien « Voir les N » vers la liste filtrée, trois boutons.
- **Boutons** (mêmes mots que la landing actuelle) : *Accepter* (va dans l'historique comme acceptée, la suivante devient n°1), *Plus tard* (descend dans « Autres recommandations »), *Écarter* (disparaît, va dans l'historique comme écartée, avec un champ optionnel « pourquoi ? »).
- **Autres recommandations** : 2 à 5 lignes avec titre et nombre d'avis. Un clic déplie la carte complète.
- **Pied de page** : date de la dernière synthèse, bouton « Actualiser », date de la prochaine synthèse possible (Gratuit).

**Onglet « Détails »** (vérification)
1. 4 compteurs : avis au total, avis cette semaine, thème n°1, recommandations en attente.
2. Graphique de volume : avis par semaine sur 8 semaines.
3. Thèmes avec nombre d'avis et variation sur 7 jours. Un clic filtre la liste d'avis.
4. Historique des décisions (Pro). En Gratuit : bloc verrouillé « Disponible avec Pro ».

**États de l'écran**

| État | Quand | Ce qu'on voit |
|---|---|---|
| A. Compte neuf | Aucun avis | Bandeau « Voici un exemple avec de vrais avis » + recommandations de démonstration étiquetées « Exemple » + gros bouton « Ajouter mes avis » |
| B. Échauffement | 1 ou 2 avis | « Encore N avis pour votre première recommandation », barre de progression sur 3 |
| C. Prêt à générer | 3 avis ou plus, aucune synthèse | « Vous avez N avis. Lancez votre première synthèse. » + bouton « Générer mes recommandations » |
| D. Génération en cours | Synthèse lancée | Indicateur « Lecture de vos avis… », boutons désactivés |
| E. Synthèse prête | Cas normal | L'écran ci-dessus |
| F. Quota atteint (Gratuit) | Dernière synthèse il y a moins de 14 jours | « Actualiser » grisé, « Prochaine possible le JJ/MM » et lien « Passer à Pro » |
| G. Erreur | La génération échoue | « La synthèse n'a pas abouti. Votre quota n'a pas été consommé. » + « Réessayer » |
| H. Limite d'avis atteinte | 50 / 50 en Gratuit | Bandeau « Vous avez atteint 50 avis. Passez à Pro pour en ajouter. » Les anciens avis restent visibles |

La démo (état A) disparaît dès le premier vrai avis.

### 3.4 Écran « Avis »

- **Haut de page** : recherche texte, filtres, bouton « Ajouter des avis ».
- **Filtres** : thème, source (CSV, manuel, widget), période, sentiment.
- **Liste** : texte tronqué, thème, source, date, point de couleur du sentiment.
- **Détail** (panneau latéral) : texte complet, thème modifiable, source, recommandations qui s'appuient sur cet avis.
- **Actions** : changer le thème, supprimer, suppression groupée.
- **États** : vide (« Aucun avis pour l'instant » + boutons d'ajout), filtres sans résultat (« Effacer les filtres »), chargement.
- **Gratuit** : compteur « N / 50 » en haut de la liste.

### 3.5 Écran « Ajouter des avis »

| Onglet | Contenu | Gratuit | Pro |
|---|---|---|---|
| Fichier CSV | Glisser-déposer, modèle de CSV, aperçu des 5 premières lignes, choix des colonnes texte et date | Oui | Oui |
| Saisie manuelle | Champ texte, date (aujourd'hui par défaut), bouton « Ajouter » | Oui | Oui |
| Widget | Extrait de code à copier, aperçu, bouton « Copier le code » | Verrouillé (cadenas) | Oui |

- **CSV au-delà de la limite** : on importe jusqu'à la limite, puis « N avis importés, M ignorés car la limite de votre plan est atteinte ».
- **Doublons** (même texte, même date) : ignorés et comptés dans le message de fin.
- **Après un ajout** : message de succès avec « Voir les recommandations » (si 3 avis ou plus).

### 3.6 Écran « Réglages »

1. **Projet** : nom, secteur, suppression.
2. **Notifications** : email du lundi (Pro ; verrouillé en Gratuit).
3. **Abonnement et usage** : plan actuel, barres d'usage (avis, projets), choix mensuel ou annuel, « Changer de plan », accès au portail de facturation.
4. **Compte** : email, mot de passe, suppression du compte et de toutes les données.

### 3.7 Textes à utiliser tels quels

| Où | Texte |
|---|---|
| Titre de l'écran principal | Cette semaine |
| Sous-titre | Les recommandations tirées de vos avis |
| Ligne du tableau de prix | Recommandations de la semaine (générées à partir de vos avis) |
| État vide | Ajoutez au moins 3 avis pour obtenir votre première recommandation. |
| Quota Gratuit atteint | Prochaine synthèse possible le JJ/MM. Avec Pro, elle est automatique chaque semaine. |
| Erreur de synthèse | La synthèse n'a pas abouti. Votre quota n'a pas été consommé. |
| Fonction verrouillée | Disponible avec Pro. |

### 3.8 Design du dashboard et automatisation

**Direction de design (validée)**
- **Une action principale par écran.** Sur « Cette semaine », c'est la recommandation n°1. Un seul bouton est mis en avant à la fois.
- **La recommandation n°1 est bien plus grande que le reste** : titre plus gros, avis cités visibles, boutons larges. Les autres recommandations restent en lignes compactes.
- **La couleur sert seulement à deux choses** : la priorité des recommandations et les alertes. Tout le reste est neutre.
- **Les états vides proposent toujours une seule action** (un seul bouton), jamais plusieurs choix.
- **Pas de décoration** : pas d'illustration ni d'animation sur les écrans de travail. Seul l'indicateur de génération bouge.

**Automatisation incluse dans la V1 (interface uniquement, sans nouveau backend)**
- Quand tu acceptes, reportes ou écartes la n°1, la recommandation suivante devient n°1 automatiquement.
- Un bandeau « N nouveaux avis depuis la dernière synthèse » avec le bouton « Actualiser », qui respecte le quota du plan.
- À l'import CSV, les colonnes texte et date sont proposées automatiquement avant validation.
- Le classement des avis par thème, la synthèse hebdomadaire (Pro) et l'email du lundi sont déjà automatiques.

**Hors V1 (demande du nouveau backend)**
- Lancer la synthèse toute seule quand un nombre d'avis est atteint.
- Récupérer les avis automatiquement depuis Google, une boutique ou les stores d'applications.

L'optimisation réelle du dashboard viendra de ce que les premiers utilisateurs font vraiment. Ce document fixe le point de départ, pas le résultat final.

### 3.9 Frontend : composants réutilisables

**État actuel du code (constaté)**
- **Bon point de départ** : Tailwind 4 avec des couleurs définies une seule fois (variables de thème), un fichier `DESIGN.md` qui décrit la palette, les polices et les arrondis, et une configuration shadcn déjà présente.
- **Les composants partagés sont rares** : le dossier des composants communs ne contient qu'un bouton de thème, et le dashboard a un seul petit fichier de briques (105 lignes).
- **La landing est un seul fichier de 1 142 lignes**, avec 123 styles écrits en dur et des couleurs copiées à la main au lieu d'utiliser les variables de thème. C'est difficile à faire évoluer sans casser quelque chose.

**Règles pour la V1**
1. **On crée les briques avant les écrans.** Chaque écran de la V1 est assemblé avec elles, aucune mise en page écrite à la main.
2. **Aucune couleur écrite en dur** dans les nouveaux composants : uniquement les variables de thème. Les couleurs de priorité et d'alerte viennent d'un seul tableau.
3. **On ne réécrit la landing qu'à l'endroit où on la modifie** (étape 4, carte Agences, tarifs, FAQ, capture). Le reste du fichier est découpé en sections plus petites au passage, sans refonte complète : c'est du temps qui ne rapporte rien avant la mise en ligne.
4. **Les états de l'écran (A à H) passent par un seul composant** qui choisit quoi afficher, au lieu de huit morceaux de code dispersés.
5. **Accessibilité de base** : focus visible au clavier, contrastes suffisants, boutons réellement cliquables au clavier, animations désactivées quand l'utilisateur le demande.
6. **Mobile d'abord** : chaque composant est conçu d'abord pour un petit écran.

**Briques de base** (à créer ou à compléter)

| Brique | Rôle |
|---|---|
| Bouton | Principal, secondaire, discret, désactivé, en chargement |
| Carte | Conteneur standard avec variantes neutre et mise en avant |
| Pastille | Plan (Gratuit, Pro), priorité, thème, source |
| Barre d'usage | Avis et projets, avec les seuils 80 % et 100 % de la section 2.4 |
| Bandeau | Information, avertissement, alerte (avec une action) |
| Fonction verrouillée | Cadenas + phrase « Disponible avec Pro » + bouton |
| État vide | Titre, une phrase, **un seul bouton** |
| Onglets | Recommandations / Détails, et les 3 modes d'ajout |
| Panneau latéral | Détail d'un avis |
| Squelette de chargement | Remplace les écrans blancs |
| Notification brève | Confirmation d'une action (accepté, importé, copié) |

**Briques métier** (assemblées à partir des briques de base)

| Brique | Rôle |
|---|---|
| Carte de recommandation | Deux formes : **grande** pour la n°1 (titre agrandi, avis cités, trois boutons) et **compacte** pour les suivantes |
| Avis cité | Texte court, date, source, lien vers l'avis complet |
| Ligne d'avis | Texte tronqué, thème, source, date, sentiment |
| Pastille de thème avec tendance | Nom, nombre d'avis, flèche haut ou bas sur 7 jours |
| Compteur d'usage | Barre d'usage + libellé du plan, dans l'en-tête |
| Message de quota | Texte et date de prochaine synthèse, selon le plan |
| Carte de tarif | Une seule carte, utilisée dans la landing et dans Réglages |
| Question de FAQ | Question dépliable |
| Section de landing | Titre, texte, contenu, avec le fond clair ou blanc en alternance |

**Ordre de construction**
1. Les briques de base et le tableau des couleurs de priorité.
2. La carte de recommandation (grande et compacte) et le composant d'états.
3. L'écran « Cette semaine » complet.
4. Les écrans Avis, Ajouter des avis et Réglages.
5. La carte de tarif, les sections de landing et la capture.

---

## 4. Landing page

La landing actuelle est déjà solide : démos animées, parcours en 4 étapes, trois publics, tarifs, questions fréquentes. On garde cette structure et on corrige seulement ce qui contredit les décisions. **Le hero est inchangé (non revu).**

### 4.1 Structure conservée et répartition en pages

**Landing (`/`)** : Hero · bande de réassurance · le problème · aperçus (Comment ça marche, Ce que vous voyez chaque semaine, Pourquoi pas un chat IA gratuit, Pour qui) · bêta ouverte ou témoignages · Tarifs · Questions fréquentes · appel final · pied de page (avec Contact, Confidentialité, Conditions, Mentions légales à ajouter).

**Pages dédiées**

| Page | Adresse | Contenu | Statut |
|---|---|---|---|
| Produit | `/produit` | Comment ça marche (4 étapes, avec leurs animations), Pour qui, comparaison avec un chat IA gratuit | Nouvelle |
| Exemple | `/exemple` | Capture de « Cette semaine » avec 3 repères numérotés | Nouvelle, interactive au lancement commun |
| Tarifs | `/pricing` | Section Tarifs (voir 4.4) | Existe |
| Contact | `/contact` | Formulaire, destination du bouton « Me prévenir » | Existe |

**Règle de l'aperçu (proposé)** : sur la landing, les sections qui ont une page dédiée n'affichent qu'un aperçu : titre, une phrase, un visuel statique (l'état final de l'animation) et un bouton « En savoir plus → » vers la page. Les animations complètes et les textes complets vivent sur la page dédiée. Le hero, inchangé, reste comme il est.

---

### 4.2 Textes revus

Ces textes s'appliquent aux sections complètes de la page Produit (4.1). La landing en montre une version courte : le titre et la première phrase.

**Comment ça marche (4 étapes)**

| Étape | Texte actuel | Texte retenu |
|---|---|---|
| 1. Import | « Importez vos avis existants. Un fichier CSV suffit… » | Inchangé |
| 2. Widget | « Recueillez les prochains avis sur votre site. Copiez un script… » | Ajouter « (avec Pro) » dans le titre : **Recueillez les prochains avis sur votre site (avec Pro).** Le reste est inchangé |
| 3. Thèmes | « Repérez ce qui revient, avec les avis à l'appui… » | Inchangé |
| 4. Décision | « Votre équipe accepte ou reporte. Rien n'est appliqué automatiquement. » | **Votre équipe accepte, reporte ou écarte chaque recommandation. Rien n'est appliqué automatiquement.** (mêmes mots que les boutons du dashboard) |

**Pour qui**

| Carte | Texte retenu |
|---|---|
| Équipes produit | Inchangé : « Les retours deviennent des décisions. » |
| Agences et freelances | Titre inchangé : « Un projet par client. » Corps : **Chaque client a son espace avec ses sources, ses avis et ses recommandations. Vous voyez d'un coup d'œil ce qui remonte, projet par projet.** On retire « un rapport par période », qui annonce le rapport partageable de la V1.1. Remettre cette phrase le jour où il est branché |
| Boutiques en ligne | Inchangé : « Voyez la friction avant qu'elle ne coûte des ventes. » |

**Tarifs**

- Titre inchangé : « Commencez gratuitement. Payez quand vos avis deviennent un rythme. »
- Ajouter une bascule **Mensuel / Annuel** (« 2 mois offerts ») sur la carte Pro.
- **Carte Gratuit** : 1 projet · 50 avis · 1 synthèse toutes les 14 jours · Import CSV et saisie manuelle · Vos avis conservés. Bouton : « Commencer gratuitement ».
- **Carte Pro (19 €/mois)** : 5 projets · 2 000 avis par projet · Synthèse automatique chaque semaine · Widget sur votre site · Email du lundi · Historique des décisions. Retirer « 14 jours d'essai sans carte ».
- **Bouton Pro** : « Commencer avec Pro » quand le paiement marche, sinon « Me prévenir » (vers Contact).
- Phrase du bas inchangée : « Vos données sont conservées si vous repassez en Gratuit. »

**Questions fréquentes**

| Question | Réponse retenue |
|---|---|
| Faut-il installer quelque chose sur mon site ? | **Seulement si vous voulez le widget (avec Pro) : vous copiez un script et le placez dans votre site, sans modifier votre code. Sinon, rien à installer.** |
| Puis-je importer mes anciens avis ? | Inchangée |
| Comment savoir d'où vient une synthèse ? | Inchangée |
| L'IA décide-t-elle à ma place ? | Inchangée |
| Combien coûte le plan gratuit ? | **Rien, sans limite de durée. Il inclut 1 projet, 50 avis, une synthèse toutes les 14 jours, l'import CSV et la saisie manuelle.** |
| *Nouvelle* : Mes avis restent-ils privés ? | **Vos avis ne sont visibles que de vous. Pour écrire les recommandations, ils sont envoyés à un fournisseur d'IA, uniquement pour cet usage.** À confirmer avec les conditions du fournisseur choisi avant publication, et à répéter dans la page Confidentialité |
| *Nouvelle* : Que se passe-t-il si je quitte Pro ? | **Vos données restent. Ce qui dépasse la limite du plan Gratuit passe en lecture seule.** |

### 4.3 Ce qui est autorisé sur la landing de la V1

| Autorisé (existe) | Interdit tant que non branché |
|---|---|
| Recommandations sourcées | Alerte « un thème monte » |
| Import CSV, saisie manuelle, widget (avec Pro) | Rapport partageable, offre Agence, « un rapport par période » |
| Email du lundi | Thèmes préconfigurés boutique |
| Historique des décisions (acceptées / écartées) | Chiffres clients, témoignages, logos : tant qu'il n'y en a pas de vrais |
| Synthèse automatique chaque semaine (Pro) | Toute mention d'un essai Pro de 14 jours |
| Plan Gratuit sans limite de durée | Bouton « Commencer avec Pro » tant que le paiement ne marche pas |

### 4.4 Page tarifs

Même contenu que la section Tarifs de la landing (le code lit la même configuration des plans), avec la bascule Mensuel / Annuel et aucune ligne « carte bancaire ».

### 4.5 Design de la landing (révisé)

**Correction de ma proposition précédente.** J'avais proposé de remplacer les démos animées par une capture fixe. C'est abandonné : les animations qui accompagnent le texte aident à comprendre, et celles de la landing actuelle montrent déjà le produit. On les garde, on les aligne avec le produit réel, et on **ajoute** une vraie capture dans une nouvelle section.

**Principes**
1. **Une section = une idée = un visuel.** Chaque section a un titre qui annonce un bénéfice, une phrase d'explication, un seul visuel, et trois points au maximum.
2. **Le visuel montre le vrai produit.** Les animations utilisent les mêmes briques que le dashboard (carte de recommandation, avis cités, pastilles de thème) avec des données d'exemple. Pas d'illustration abstraite qui ne ressemble à rien dans l'application.
3. **Alternance de fonds** : clair, blanc, un bloc sombre pour le problème et pour l'appel final.
4. **Le hero est inchangé.**

### 4.6 Sections : audit et ordre final

| # | Section | Statut | Où | Rôle |
|---|---|---|---|---|
| 1 | Hero | Existe, **inchangé** | Landing | Promesse et bouton principal |
| 2 | Bande de réassurance | **À ajouter** | Landing | Une ligne sous le hero : « Prêt en quelques minutes · dès 3 avis · sans carte bancaire · CSV ou widget » |
| 3 | Le problème | Existe | Landing | Bloc sombre : « Les avis s'accumulent. Les décisions, elles, attendent. » Reste statique, sans animation |
| 4 | Comment ça marche (4 étapes) | Existe, **à aligner** | Aperçu sur la landing, version complète sur `/produit` | Une animation par étape sur `/produit` (voir 4.7) |
| 5 | Ce que vous voyez chaque semaine | **À ajouter** | Aperçu sur la landing, version complète sur `/exemple` | Vraie capture de « Cette semaine » avec 3 repères numérotés : la recommandation, les avis qui la prouvent, votre décision. Sur la landing, bouton « Voir un exemple » vers `/exemple` |
| 6 | Pourquoi pas un chat IA gratuit ? | **À ajouter** | Aperçu sur la landing, version complète sur `/produit` | Petite comparaison honnête (voir ci-dessous) |
| 7 | Pour qui | Existe, textes revus en 4.2 | Aperçu sur la landing, version complète sur `/produit` | Trois cartes |
| 8 | Témoignages | Existe, **reste masqué** | Landing | Ne s'affiche que lorsque de vrais témoignages existent, avec accord écrit. Jamais de faux. Tant qu'il n'y en a pas, la bande « Bêta ouverte » de la section 4.9 prend sa place |
| 9 | Tarifs | Existe, revu en 4.2 | Landing et `/pricing` | Gratuit, Pro et Agence, mensuel et annuel |
| 10 | Questions fréquentes | Existe, revu en 4.2 | Landing | Dont la confidentialité des avis. Lien dans le pied de page |
| 11 | Appel final | Existe | Landing | Bloc sombre avec le bouton principal. Les pages `/produit` et `/exemple` se terminent par un court bloc équivalent |
| 12 | Pied de page | Existe, **à compléter** | Toutes les pages | FAQ, Contact, Confidentialité, Conditions, Mentions légales |

**Section 6 : contenu de la comparaison**

| | Un chat IA gratuit | Qualio |
|---|---|---|
| Avis cités à l'appui de chaque conseil | Selon ce que vous lui demandez | Oui, toujours |
| Mémoire des avis d'une semaine à l'autre | Non, il faut tout recoller | Oui |
| Collecte continue sur votre site | Non | Oui, avec le widget (Pro) |
| Rappel chaque semaine | Non | Oui, par email (Pro) |
| Suivi de ce que vous avez accepté ou écarté | Non | Oui |

Cette section répond à la principale objection du public. Chaque ligne doit rester vraie : si une fonction n'est pas branchée, la ligne est retirée.

**Boutons d'action : où les placer**
Le bouton « Commencer gratuitement » apparaît dans la barre de navigation, dans le hero, après l'aperçu de la section 5, dans les tarifs, dans l'appel final de la landing et en fin de page de `/produit` et `/exemple`, et nulle part ailleurs. Le bouton secondaire « Voir un exemple » mène à la page `/exemple`.

### 4.7 Animations d'illustration

Les animations ci-dessous vivent sur la page `/produit`. Sur la landing, l'aperçu de chaque section montre l'état final, sans animation (voir 4.1).

**Une animation par étape de « Comment ça marche »**

| Étape | Ce que montre l'animation |
|---|---|
| 1. Importer | Un fichier se dépose et les lignes d'avis apparaissent une à une dans un tableau, avec le compteur « 40 avis » |
| 2. Collecter (Pro) | Un petit widget reçoit un avis qui vient s'ajouter à la liste |
| 3. Repérer | Les avis se regroupent en pastilles de thème avec leur nombre |
| 4. Décider | La carte de recommandation apparaît, les avis cités s'affichent, le bouton « Accepter » est cliqué et la suivante devient n°1 |

**Règles**
- L'animation démarre quand la section entre à l'écran et se joue **une seule fois**, en quelques secondes. Elle ne tourne pas en boucle.
- À la fin, l'image reste lisible. Un bouton « Rejouer » est proposé.
- **Aucune information n'est donnée uniquement par le mouvement** : le texte dit la même chose.
- Quand l'utilisateur a demandé moins d'animations, on affiche directement l'état final (le code gère déjà ce cas).
- **Légèreté** : pas de vidéo, pas de bibliothèque supplémentaire. La hauteur des illustrations est réservée à l'avance pour éviter que la page saute. Elles ne se chargent que lorsqu'elles approchent de l'écran.
- **Mobile** : version simplifiée, avec moins d'éléments, mais le même message.
- **Vocabulaire** : les boutons montrés dans les animations sont Accepter, Plus tard, Écarter.
- **Dépendance** : l'animation de l'étape 4 et la capture de la section 5 s'alignent sur le nouvel écran « Cette semaine ». Elles se mettent à jour une fois cet écran construit. D'ici là, on garde les démos actuelles.

### 4.8 Barre de navigation

**Constat** : la barre actuelle est une pilule flottante (bords entièrement arrondis) de 5xl de large, avec les liens Fonctionnement, Pour qui, Tarifs, FAQ, puis « Se connecter » et un bouton « Commencer » lui aussi entièrement arrondi. Le reste de la page est plus large (6xl), donc la barre n'est pas alignée avec le contenu.

**Décisions**

| Élément | Décision |
|---|---|
| **Forme** | Barre pleine largeur collée en haut, 64 px de haut, fond blanc légèrement transparent, simple trait fin en dessous. Fini la pilule flottante. Le contenu de la barre s'aligne sur la largeur de la page |
| **Liens** | **Produit · Exemple · Tarifs.** Chaque lien mène à une page dédiée (`/produit`, `/exemple`, `/pricing`). L'ordre suit le parcours d'un visiteur : comprendre, voir, acheter. Le logo ramène à l'accueil |
| **Structure du site** | Le site n'est plus une page unique : la landing, `/produit`, `/exemple`, `/pricing` et `/contact` (voir 4.1) |
| **« Fonctionnement », « Pour qui » et « FAQ »** | **Retirés de la barre.** « Fonctionnement » et « Pour qui » vivent sur la page Produit. La FAQ reste une section de la landing, au-dessus de l'appel final, avec un lien dans le pied de page |
| **« Contact »** | **Retiré de la barre, déplacé dans le pied de page.** La page existe déjà et reste la destination du bouton « Me prévenir » du plan Pro. Aucun travail de plus |
| **Droite de la barre** | « Se connecter » (lien texte) puis le bouton principal **« Commencer gratuitement »** (« Commencer » sur mobile) |
| **Menu déroulant** | **Aucun en V1.** Trois destinations seulement, un déroulant n'ajouterait que de la complexité |
| **Mobile** | Icône de menu, qui ouvre un panneau pleine largeur avec les trois mêmes liens. Le bouton « Commencer » reste visible hors du menu |
| **Pendant le défilement** | Le trait fin sous la barre apparaît quand on quitte le haut de la page, et le lien de la page en cours est mis en valeur |
| **Ancres** | Un espace est réservé sous la barre pour que le titre d'une section ne soit pas caché quand on arrive sur une ancre (FAQ, tarifs) |

**Formes arrondies**
- **Boutons** (celui de la barre compris) : coins à **8 px**, au lieu d'une forme entièrement arrondie. Mêmes coins pour les liens de la barre au survol.
- **Cartes et blocs** (proposé) : **16 px** au lieu de 36 px, pour rester dans l'échelle du fichier `DESIGN.md` (6, 8, 12, 16 px). À appliquer à toute la landing pour que l'ensemble reste cohérent.
- **Pastilles et étiquettes** : 6 à 8 px.

**Pour la V1.1** : la page Exemple devient une démo cliquable, sans compte. Rien d'autre n'est ajouté à la barre. On y reviendra seulement s'il existe des pages dédiées qui le justifient.

### 4.9 Témoignages

**Règle : aucun faux témoignage.** Je n'en invente pas et je n'en propose pas. Dans l'Union européenne, publier de faux avis est interdit et sanctionné. Et pour un outil dont la promesse est « chaque conseil est sourcé », un faux témoignage ruinerait la confiance.

**Obtenir de vrais témoignages avant ou juste après le lancement**
1. **Bêta fermée de 10 personnes** : des freelances, des agences, de petites boutiques, des équipes produit. Elles utilisent le Gratuit avec leurs vrais avis.
2. **Où les trouver** : ton réseau direct d'abord, puis les communautés où se trouvent tes trois publics (LinkedIn, groupes de freelances et d'agences, communautés de créateurs de boutiques).
3. **Le message d'invitation** est dans la conversation. Il promet un accès gratuit contre un retour honnête, rien d'autre.
4. **Après 2 semaines**, trois questions seulement :
   - Quel problème aviez-vous avec vos avis avant ?
   - Qu'avez-vous décidé ou changé grâce à une recommandation ?
   - Quelle phrase diriez-vous à un collègue ?
5. **Demander les chiffres** quand il y en a (temps gagné, avis traités, décision prise). Un témoignage précis vaut plus que dix compliments.
6. **Accord écrit avant toute publication** (un email suffit), avec le nom, le rôle et l'entreprise à afficher. Garder cet email.

**En attendant : ce qui rassure sans faux témoignage**
- **La bande « Bêta ouverte »** à la place des témoignages : « Qualio est en bêta ouverte. Rejoignez les premiers utilisateurs et aidez-nous à le façonner. » avec le bouton « Commencer gratuitement ». Elle dit la vérité et transforme le manque de preuves en invitation.
- **La page Exemple** et la capture de « Cette semaine » : le produit se prouve lui-même.
- **Un court mot du fondateur** (« Pourquoi j'ai créé Qualio »), avec ton vrai nom. C'est authentique et ça humanise la page.

**Quand les vrais témoignages arrivent**
- Trois cartes au maximum : une phrase, le nom, le rôle, l'entreprise (si accord), et le résultat chiffré quand il existe.
- Elles s'affichent après « Pour qui » (section 8). Le code masque déjà la section quand la liste est vide : il suffit de la remplir.
- Les citations restent telles que la personne les a écrites, sans retouche de ma part ni de la tienne.

---

## 5. Tout ce qu'il faut connecter

### 5.1 Supabase (base de données et connexion)

- Créer le projet de production (région proche de tes utilisateurs).
- Appliquer les **32 migrations** dans l'ordre. **Sauvegarde avant**, car l'une d'elles supprime les anciennes tables du produit QA.
- Récupérer : l'URL du projet, la clé publique (anon) et la clé de service (secrète).
- Dans Authentification > URL : définir l'adresse du site et ajouter `https://TON-DOMAINE/auth/callback` aux adresses de redirection autorisées.
- **Connexion Google** : le code la propose. Il faut créer les identifiants OAuth dans la console Google Cloud et les coller dans Supabase. Sans ça, retire le bouton Google ou il échouera.
- Connexion par email et mot de passe, et par code (OTP) : à activer dans Supabase, avec l'envoi d'email de confirmation configuré.

### 5.2 Stripe (paiement)

- **Pays** : d'après des guides tiers (pas la page officielle de Stripe), un compte marchand ne peut pas être ouvert directement au Bénin ; seuls certains services de Stripe, comme le calcul des taxes, couvrent le pays. Le test définitif et la marche à suivre sont au chapitre 9.1.
- Créer le produit **Qualio Pro** avec deux prix : **19 €/mois** et **190 €/an**.
- Le code ne connaît aujourd'hui qu'**un seul prix** (`STRIPE_PRICE_PRO`). Il faut ajouter le prix annuel (nouvelle variable) et adapter le choix mensuel/annuel au paiement.
- Créer le point d'entrée webhook : `https://TON-DOMAINE/api/billing/webhook`, avec les événements `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`. Copier le secret de signature.
- Activer et configurer le **portail client** (annulation, changement de moyen de paiement, factures).
- Tester d'abord en mode test de Stripe, puis passer en mode réel avec les clés réelles.
- Lancement commun : ajouter le produit **Agence** (49 €/mois, 490 €/an) et sa variable de prix.

### 5.3 Resend (emails)

- Créer le compte, ajouter ton domaine d'envoi, ajouter les enregistrements DNS demandés (vérification du domaine, SPF, DKIM) et attendre la validation.
- Définir l'adresse d'expéditeur (variable `FEEDBACK_FROM_EMAIL`), sur le domaine vérifié.
- Créer le webhook Resend vers `https://TON-DOMAINE/api/webhooks/resend` et copier son secret.
- Sans domaine vérifié, les emails n'arrivent pas (ou vont en spam) : l'email du lundi ne fonctionnera pas.

### 5.4 Fournisseur d'IA

- Le code accepte deux fournisseurs (Gemini et OpenAI) choisis par `FEEDBACK_AI_PROVIDER`.
- **Décision** : Gemini en production (voir 9.3). Renseigner `FEEDBACK_AI_PROVIDER=gemini` explicitement, car le code utilise OpenAI quand cette variable est absente.
- Mettre un **plafond de dépense** mensuel dans la console du fournisseur.
- Suivre le coût réel par synthèse (le code l'enregistre) pour ajuster 50 / 2 000 avis.

### 5.5 Vercel (hébergement)

- Importer le dépôt, ajouter le domaine, renseigner toutes les variables (tableau 5.6).
- Le **cron** est déjà défini : l'email du lundi part chaque lundi à 08:00 (heure UTC). Il appelle `/api/cron/weekly-digest` avec le secret `CRON_SECRET`.
- **(à vérifier)** Le plan gratuit de Vercel est prévu pour un usage non commercial. Pour un produit payant, prévois le plan adapté.

### 5.6 Variables d'environnement

| Variable | Rôle | Où l'obtenir |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Adresse publique du site | Ton domaine |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service (secrète, jamais côté navigateur) | Supabase |
| `STRIPE_SECRET_KEY` | Clé secrète de paiement | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Signature du webhook | Stripe |
| `STRIPE_PRICE_PRO` | Prix Pro mensuel | Stripe |
| `STRIPE_PRICE_PRO_ANNUAL` (**à ajouter**) | Prix Pro annuel | Stripe |
| `RESEND_API_KEY` | Envoi d'emails | Resend |
| `RESEND_WEBHOOK_SECRET` | Signature du webhook Resend | Resend |
| `FEEDBACK_FROM_EMAIL` | Adresse d'expéditeur | Domaine vérifié |
| `UNSUBSCRIBE_TOKEN_SECRET` | Signature des liens de désabonnement | À générer (longue chaîne aléatoire) |
| `CRON_SECRET` | Protège l'appel du cron | À générer (longue chaîne aléatoire) |
| `FEEDBACK_AI_PROVIDER` | Fournisseur d'IA choisi | Gemini ou OpenAI |
| `GEMINI_API_KEY` et `GEMINI_FEEDBACK_MODEL` | Clé et modèle Gemini | Google |
| `OPENAI_API_KEY` et `OPENAI_FEEDBACK_MODEL` | Clé et modèle OpenAI | OpenAI |

Ne pas renseigner `RESEND_TEST_EMAIL` en production (réservé aux tests).

### 5.7 Pages légales et contact (manquantes aujourd'hui)

Le projet n'a **pas** de page Confidentialité, Conditions d'utilisation ni Mentions légales. À créer avant de recevoir de vrais utilisateurs, surtout que tu traites leurs avis clients et que tu encaisses des paiements. La page Contact existe déjà. À faire relire par un juriste si possible, je ne suis pas avocat.

### 5.8 Suivi après la mise en ligne

- Alertes d'erreur et journaux de Vercel.
- Tableau de bord Stripe (paiements échoués, abonnements).
- Sauvegardes automatiques de Supabase activées.
- Un compteur du coût d'IA par semaine.

---

## 6. Travail de code pour la V1

| # | Tâche | Détail |
|---|---|---|
| 1 | Offres et limites | Mettre à jour la configuration des plans : Gratuit 1 projet, 50 avis par projet (aujourd'hui la limite est de 500 par mois), 1 synthèse toutes les 14 jours, widget retiré du Gratuit ; Pro 5 projets (déjà la valeur actuelle), 2 000 avis par projet, synthèse manuelle 1 par jour et par projet (aujourd'hui 12 synthèses par mois). La section tarifs de la landing lit cette configuration : elle se met à jour toute seule |
| 2 | Supprimer l'essai Pro de 14 jours | Retirer la logique d'essai et son affichage |
| 3 | Prix annuel | Ajouter le prix annuel au paiement et au webhook |
| 4 | Délai de 14 jours | Calculer la prochaine synthèse possible et l'afficher |
| 4 bis | Composants réutilisables | Créer les briques de la section 3.9 avant les écrans |
| 5 | Écran « Cette semaine » | Nouvelle mise en page avec les 8 états et l'onglet Détails |
| 6 | Menu à 4 entrées | Thèmes et Actions deviennent des filtres |
| 7 | Écrans Avis, Ajouter des avis, Réglages | Selon les sections 3.4 à 3.6 |
| 8 | Démo pré-remplie | Avis d'exemple étiquetés « Exemple » |
| 9 | Verrous et cadenas | Widget, email du lundi, historique : verrouillés en Gratuit |
| 10 | Landing et page tarifs | Selon la section 4 |
| 11 | Pages légales | Selon 5.7 |
| 10 bis | Design des écrans | Appliquer la section 3.8 : n°1 agrandie, couleur réservée à la priorité et aux alertes, états vides à action unique, automatisations d'interface |
| 11 bis | Textes de la landing | Appliquer la section 4 (étape 4, carte Agences, tarifs, FAQ). Le hero ne change pas |
| 12 | Libellés et traductions | Appliquer les textes de 3.7 |
| 13 | Design de la landing | Appliquer les sections 4.5 à 4.7 : ajouter la bande de réassurance, la section « Ce que vous voyez chaque semaine » (aperçu sur la landing, version complète sur la page Exemple) et la comparaison avec un chat IA (aperçu sur la landing, version complète sur la page Produit), aligner les animations et leurs boutons sur le nouveau produit, compléter le pied de page |
| 14 | Barre de navigation | Appliquer la section 4.8 : barre pleine largeur, liens « Produit · Exemple · Tarifs » (Fonctionnement, Pour qui, FAQ et Contact retirés de la barre, Contact conservé dans le pied de page), bouton et coins à 8 px, mise en valeur de la page en cours, panneau mobile avec les trois liens |
| 15 | Coins arrondis de la landing | Appliquer l'échelle de la section 4.8 aux cartes, boutons et pastilles |
| 16 | Bande « Bêta ouverte » | Remplace les témoignages tant que la liste est vide (section 4.9) |
| 17 | Page Produit | Créer `/produit` avec Comment ça marche (animations de 4.7), Pour qui et la comparaison avec un chat IA ; sur la landing, remplacer ces sections par des aperçus avec « En savoir plus → » (4.1) |
| 18 | Page Exemple | Créer `/exemple` : capture de « Cette semaine » avec 3 repères numérotés et bouton « Commencer gratuitement ». Statique en V1 |

---

## 7. Ordre de mise en ligne

1. Tester la création d'un compte Stripe et acheter le domaine (chapitre 9). Ça ne bloque pas le lancement : le Gratuit sort d'abord, le Pro suit quand le paiement marche.
2. Créer Supabase, appliquer les migrations (avec sauvegarde), configurer l'authentification.
3. Faire le travail de code du chapitre 6.
4. Créer Stripe (mode test), Resend (domaine vérifié), la clé d'IA avec plafond.
5. Déployer sur Vercel avec toutes les variables.
6. **Parcours de contrôle minimum**, de bout en bout, sur le site déployé et sur un téléphone :
   1. créer un compte,
   2. importer un petit CSV,
   3. générer une synthèse,
   4. cliquer Accepter et Écarter,
   5. payer avec une carte de test Stripe,
   6. vérifier que le plan passe en Pro,
   7. annuler via le portail,
   8. déclencher l'email du lundi à la main.
7. Passer Stripe en mode réel, vérifier le webhook, publier la landing.
8. Inviter les premiers utilisateurs (3 à 5 personnes, avec leurs propres avis).

---

## 8. Fonctions V1.1 incluses au lancement

**Incluses au lancement commun ; à implémenter et vérifier**
- Alerte « un thème monte » : bandeau en haut de « Cette semaine » et email. Seuil proposé : au moins +5 avis et +50 % en 7 jours, une alerte par thème au maximum tous les 7 jours.
- Rapport partageable (Agence) : bouton « Partager le rapport », nom du client, lien non devinable, désactivable, expiration à 90 jours (proposé), lecture seule, aucune donnée personnelle des auteurs d'avis.
- Thèmes boutique : choix « Général » ou « Boutique en ligne » à la création du projet.
- Offre Agence avec son prix Stripe.
- Page Exemple cliquable : démo sans compte, à la place de la capture statique.

**Plus tard**
- Nouvelles intégrations (outils de support, boutiques, réseaux).
- Export PDF des rapports.
- Plusieurs utilisateurs par compte (si l'application ne le gère pas déjà).
- Application mobile native.

---

## 9. Décisions finales sur les trois points restants

### 9.1 Paiement

**Ce que je sais** : des guides tiers indiquent qu'un compte marchand Stripe ne s'ouvre pas directement au Bénin. Le pays est couvert pour le calcul des taxes et apparaît dans des listes de versements à des vendeurs, ce qui est différent d'un compte pour encaisser des abonnements. Je n'ai pas pu lire la page officielle de disponibilité de Stripe : le test de création de compte tranche.

**Décision**
1. **Aujourd'hui, 10 minutes** : essayer de créer un compte Stripe en indiquant le Bénin comme pays de l'entreprise.
2. **Si c'est accepté** : on continue comme prévu (chapitre 5.2).
3. **Si c'est refusé**, deux voies :
   - **Stripe Atlas** (créer une société américaine) : le code ne change pas, mais il y a des frais et des démarches administratives.
   - **Un « merchant of record »** (un intermédiaire qui vend à ta place et gère les taxes) : moins d'administration, mais il faut réécrire le paiement et le webhook, et vérifier que ton pays est accepté pour recevoir les versements.
   - **Recommandation par défaut** : Atlas si tu veux zéro réécriture ; l'intermédiaire si tu préfères éviter la société américaine et acceptes un chantier de code.
4. **Le paiement est une condition du lancement commun.** Si Stripe ne peut pas encaisser, choisir une solution compatible avant de réécrire le paiement ; ne pas créer de société ou acheter un service automatiquement.

### 9.2 Nom de domaine

**Décision**
- Acheter **un domaine à ton nom de produit** chez un registraire. Ordre d'essai : `qualio.com`, puis `qualio.app`, puis `getqualio.com`, puis `tryqualio.com`. Prendre le premier disponible. Je n'ai pas pu vérifier leur disponibilité.
- Envoyer les emails depuis **un sous-domaine dédié** (par exemple `mail.TON-DOMAINE`), avec une adresse du type `Qualio <lundi@mail.TON-DOMAINE>`. Ça protège la réputation du domaine principal.
- Brancher le domaine dans cet ordre : Vercel, puis Supabase (adresses de redirection), puis Resend (DNS), puis Stripe (webhook).
- L'adresse temporaire de Vercel sert aux tests, mais pas aux emails : l'email du lundi a besoin du vrai domaine vérifié.

### 9.3 Fournisseur d'IA

**Décision : Gemini en production**, avec un modèle de la famille « flash » (rapide et économique, adapté à la lecture de beaucoup d'avis).
- Avant de trancher définitivement, **un test sur les mêmes 40 avis** avec les deux fournisseurs : comparer le coût de la synthèse et la qualité des recommandations. Garder Gemini sauf si la qualité est clairement insuffisante.
- Renseigner `FEEDBACK_AI_PROVIDER=gemini`. Sans cette variable, le code choisit OpenAI.
- **Vérifier que les noms de modèles du code existent chez le fournisseur** : le code référence un modèle par défaut et un modèle de secours que je n'ai pas pu confirmer. Un nom invalide fait échouer toutes les synthèses.
- Mettre un **plafond de dépense mensuel** dans la console du fournisseur avant l'ouverture.

### 9.4 Ce qui reste, sans décision à prendre

Deux actions de ta part : le test de création de compte Stripe, et l'achat du domaine. Tout le reste de ce document est décidé.
