const fs = require('node:fs')
const path = require('node:path')
const source = process.argv[2]
if (!source) throw new Error('Provide the original launch document path.')
const root = path.resolve(__dirname, '..')
let document = fs.readFileSync(source, 'utf8').replace(/^\uFEFF/, '')
document = document.replace(/\*\*Statut : figé[^\r\n]*/, '**Statut : version de travail 1.7, mise à jour le 13 octobre 2026.** Le lancement validé inclut Gratuit, Pro et Agence ainsi que V1 + V1.1. Les spécifications décrivent la cible ; la matrice ci-dessous décrit le code réellement présent.')
document = document.replace('**V1 = étape 1, avec deux offres : Gratuit et Pro.**', '**Lancement commun = V1 + V1.1, avec trois offres : Gratuit, Pro et Agence.**')
document = document.replace(/\*\*V1\.1 = étape 2[^\r\n]*/, '**La V1.1 est incluse au lancement commun : alertes, rapport partageable, thèmes boutique et exemple interactif.**')
document = document.replace('## 8. Après la V1', '## 8. Fonctions V1.1 incluses au lancement')
document = document.replace('**V1.1 (juste après)**', '**Incluses au lancement commun ; à implémenter et vérifier**')
document = document.replace('### 2.2 V1.1 (ajout)', '### 2.2 Agence (incluse au lancement commun)')
document = document.replace('**Essai Pro de 14 jours : supprimé (proposé).**', '**Suppression des nouveaux essais Pro : validée.** Les essais existants sont honorés jusqu’à leur échéance.')
document = document.replace(/## 0\. Périmètre[\s\S]*?(?=## 1\. Positionnement)/, `## 0. Périmètre du lancement (décision actualisée)

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

`)
document = document.replace('**Agence** |', '**Agence** |')
document = document.replace('L’alerte « un thème monte » est aussi donnée au Pro à la sortie de la V1.1.', 'L’alerte « un thème monte » est incluse dans Pro et Agence au lancement commun.')
document = document.replace("L'alerte « un thème monte » est aussi donnée au Pro à la sortie de la V1.1.", "L'alerte « un thème monte » est incluse dans Pro et Agence au lancement commun.")
document = document.replace(/La page Exemple devient une démo cliquable, sans compte\./g, 'La page Exemple est une démo cliquable, sans compte, dès le lancement commun.')
document = document.replace('Nouvelle, statique en V1', 'Nouvelle, interactive au lancement commun')
document = document.replace(/\*\*V1\.1\*\* : ajouter le produit/g, '**Lancement commun** : ajouter le produit')
document = document.replace('V1.1 : ajouter le produit', 'Lancement commun : ajouter le produit')
document = document.replace(/4\. \*\*Dans tous les cas, le paiement ne bloque pas le lancement\.\*\*[^\r\n]*/, '4. **Le paiement est une condition du lancement commun.** Si Stripe ne peut pas encaisser, choisir une solution compatible avant de réécrire le paiement ; ne pas créer de société ou acheter un service automatiquement.')
document = document.replace('Gratuit et Pro, mensuel et annuel', 'Gratuit, Pro et Agence, mensuel et annuel')
document = document.replace('Gratuit et Pro, mensuel et annuel', 'Gratuit, Pro et Agence, mensuel et annuel')
document = document.replace('La V1 sort avec le Gratuit ouvert.', 'Le lancement commun attend la validation des trois offres.')
const tracking = `## Suivi du code — 13 octobre 2026

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

`
document = document.replace('## 0. Périmètre', tracking + '## 0. Périmètre')
fs.mkdirSync(path.join(root, 'docs'), { recursive: true })
fs.writeFileSync(path.join(root, 'docs', 'QUALIO_LAUNCH.md'), document, 'utf8')
console.log('Updated docs/QUALIO_LAUNCH.md with the complete source and implementation tracking.')
