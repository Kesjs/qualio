# Prospection (cold emailing) : page /admin/acquisition

Flux : Ajouter (CSV ou domaines) → À contacter → Brouillons → Suivi.

## Migration SQL (à appliquer toi-même, jamais automatique)
`supabase/migrations/20261023120000_acquisition_tracking.sql` : ajoute delivered_at, bounced_at, bounce_reason, replied_at, follow_up_of + index sur acquisition_messages.

## Variables d'environnement
- RESEND_API_KEY : clé d'envoi
- ACQUISITION_FROM_EMAIL : adresse d'envoi dédiée à la prospection (ex. kennedy@hello.tryqualio.pro), distincte de FEEDBACK_FROM_EMAIL pour protéger les emails du produit. À défaut, FEEDBACK_FROM_EMAIL est utilisée.
- ACQUISITION_REPLY_TO : permet de remplacer l’adresse de réponse ; par défaut, les réponses et demandes « stop » vont à contact@tryqualio.pro, l’adresse professionnelle du site.
- ACQUISITION_DAILY_LIMIT : plafond d'envois par jour (défaut 50)
- RESEND_WEBHOOK_SECRET : déjà utilisée ; dans Resend, active aussi l'événement `email.delivered` (en plus de bounced/complained)

## Trouver des prospects (OpenStreetMap)
Onglet « Trouver des prospects » : type d'établissement + ville. Qualio interroge Nominatim et Overpass (gratuits, aucune clé), garde les entreprises dont le site est renseigné, puis « Préparer » cherche leurs emails publics et rédige les brouillons. Données © contributeurs OpenStreetMap (ODbL). Google Maps n'est pas utilisé : ses conditions interdisent de stocker les résultats.

## CSV
Colonnes reconnues : email, entreprise, domaine, nom (ou prénom + nom), poste. Une simple liste d'emails marche aussi. Séparateur virgule, point-virgule ou tabulation. 500 lignes max.

## Cibles
Priorité : e-commerce/D2C, SaaS B2B, agences web (mode IA). Les établissements locaux (OSM) restent possibles mais leurs avis vivent sur Google/TripAdvisor : cible moins adaptée. Santé retirée.

## Messages
Premier mail : une seule demande (export d'avis contre 3 thèmes gratuits). Une phrase d'accroche n'est ajoutée que si le site montre des avis ou une collecte de feedback ; sinon aucune fausse personnalisation. Une seule relance, 4 jours après, avec le lien https://tryqualio.pro/exemple (avis d'exemple, à ne pas présenter comme leur rapport). Le pied de page de l'email indique l'origine de l'adresse et le « stop ». Les adresses nominatives passent avant les contact@/info@ ; les boîtes partagées sont signalées.

## Conseils d'envoi
Sous-domaine dédié (ex. hello.tryqualio.pro) avec SPF, DKIM et DMARC dans Resend, chauffé 2 semaines, 20 à 30 mails par jour au début, emails vérifiés avant import.
