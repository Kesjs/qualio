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

## Conformité des envois (octobre 2026)
- **Identité de l'expéditeur** : le pied de chaque email affiche l'éditeur, la forme juridique, l'immatriculation et l'adresse postale lus dans `src/lib/legal.ts` (la même source que les mentions légales). Tant que `publisher` et `address` sont vides, l'envoi manuel et le cron de relance sont **bloqués**.
- **Désinscription en un clic** : chaque email porte un lien « Me désinscrire » (page publique `/desinscription`, sans compte) et les en-têtes `List-Unsubscribe` (lien https + mailto) et `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058, boutons natifs de Gmail et Apple Mail). La demande passe l'adresse en `suppressed`, annule brouillons et relances en attente, et garde la date et la source (`unsubscribed_at`, `unsubscribe_source`).
- **« stop » par réponse** : le webhook `email.received` exclut l'adresse quand l'objet commence par « stop » (c'est ce que produit le lien mailto) et ignore les réponses automatiques (absence, accusé de réception). Un « stop » écrit dans le corps du message se traite avec le bouton « Stop reçu » du Suivi.
- **Page de confidentialité** : section « Si Qualio vous a écrit sans que vous soyez client » (origine des adresses, base légale, durée de 3 ans, droits).
- **Migration à appliquer** : `supabase/migrations/20261028100000_acquisition_unsubscribe_audit.sql`. Sans elle, l'exclusion fonctionne mais la date de désinscription n'est pas enregistrée.
- **Relances** : une seule relance par contact. L'envoi manuel d'une relance annule celle du cron, et le cron respecte le plafond journalier et ne retente jamais un échec.
