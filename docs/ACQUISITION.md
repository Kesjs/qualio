# Prospection (cold emailing) : page /admin/acquisition

Flux : Ajouter (CSV ou domaines) → À contacter → Brouillons → Suivi.

## Migration SQL (à appliquer toi-même, jamais automatique)
`supabase/migrations/20261023120000_acquisition_tracking.sql` : ajoute delivered_at, bounced_at, bounce_reason, replied_at, follow_up_of + index sur acquisition_messages.

## Variables d'environnement
- RESEND_API_KEY, FEEDBACK_FROM_EMAIL : déjà utilisées pour l'envoi
- ACQUISITION_REPLY_TO : permet de remplacer l’adresse de réponse ; par défaut, les réponses et demandes « stop » vont à contact@tryqualio.pro, l’adresse professionnelle du site.
- ACQUISITION_DAILY_LIMIT : plafond d'envois par jour (défaut 25)
- RESEND_WEBHOOK_SECRET : déjà utilisée ; dans Resend, active aussi l'événement `email.delivered` (en plus de bounced/complained)

## Trouver des prospects (OpenStreetMap)
Onglet « Trouver des prospects » : type d'établissement + ville. Qualio interroge Nominatim et Overpass (gratuits, aucune clé), garde les entreprises dont le site est renseigné, puis « Préparer » cherche leurs emails publics et rédige les brouillons. Données © contributeurs OpenStreetMap (ODbL). Google Maps n'est pas utilisé : ses conditions interdisent de stocker les résultats.

## CSV
Colonnes reconnues : email, entreprise, domaine, nom (ou prénom + nom), poste. Une simple liste d'emails marche aussi. Séparateur virgule, point-virgule ou tabulation. 500 lignes max.

## Conseils d'envoi
Domaine d'envoi chauffé 2 semaines, 20 à 30 mails par jour au début, emails vérifiés avant import.
