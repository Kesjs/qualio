# Checklist UI Qualio Feedback

Cette checklist doit être rejouée sur iPhone Safari en clair et en sombre. Les états listés sont prévus dans le code ; la vérification visuelle réelle reste à faire sur appareil.

| Écran | Chargement | Vide | Erreur / action | Succès | 375 px / sombre / clavier |
| --- | --- | --- | --- | --- | --- |
| Vue d’ensemble | Skeleton des métriques et panneaux | Carte « Votre espace est prêt à écouter » avec CSV, widget, ajout manuel | Message lisible et lien Collecte | Compteurs et recommandation à décider mis à jour | À vérifier visuellement |
| Avis | État de chargement de la boîte de réception | Action Ajouter un avis / Collecte | « Réessayer » | Avis marqué Examiné visible | À vérifier visuellement |
| Thèmes | Skeleton de cartes | Explication et lien Avis | « Réessayer » | Thèmes reliés aux avis | À vérifier visuellement |
| Synthèses | Bouton indique Génération… | Lien « Générez une synthèse » et bouton désactivé sous 3 avis | Erreur non technique + Réessayer | Confirmation et historique | À vérifier visuellement |
| Recommandations | Skeleton en deux cartes | Lien vers Synthèses | Réessayer | Toast/message après accepter, refuser, faite | À vérifier visuellement |
| Collecte | Skeleton du projet et de la source | Bouton Préparer le widget | Message d’action + Réessayer | Script copié, vérification d’installation | À vérifier visuellement |
| Réglages | Skeleton de la page | Préférences à false et boutons d’action | Message lisible + Réessayer | Profil, notification et mot de passe confirmés | À vérifier visuellement |
| Onboarding | Boutons désactivés pendant l’action | CSV d’exemple téléchargeable | Résultat import `{imported, skipped, reasons}` | Première synthèse proposée dès 3 avis | À vérifier visuellement |
| Avis d’exemple | N/A | N/A | Confirmation avant suppression | Bandeau permanent tant qu’ils existent | À vérifier visuellement |
| Widget public | N/A | N/A | Erreur d’envoi non bloquante | « Merci pour votre retour » | À vérifier visuellement sur page mobile |
| Vérification email / mot de passe | N/A | N/A | Renvoi et délai à vérifier dans le parcours | Message de confirmation | À vérifier visuellement |
| 404 / erreur générale | N/A | N/A | Bouton Réessayer / Retour dashboard | Retour visible | À vérifier visuellement |

Contrôles transverses : pas de défilement horizontal à 375 px, cibles tactiles d’au moins 44 px, champs en 16 px, focus visible, messages `aria-live`, mode sombre contrasté, et respect de `prefers-reduced-motion`.

Non vérifié visuellement par l’agent : rendu réel sur Safari iPhone, lecteur d’écran, clavier virtuel, Gmail/Apple Mail/Outlook et installation du widget sur Webflow, WordPress, Shopify et HTML réel.
