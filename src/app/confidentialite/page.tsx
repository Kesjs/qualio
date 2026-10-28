import type { Metadata } from 'next'
import { Fill, LEGAL, LegalPage, LegalSection } from '@/components/landing/legal'

export const metadata: Metadata = { title: 'Confidentialité — Qualio', description: 'Quelles données Qualio traite, pourquoi, avec qui, et comment les supprimer.' }

export default function ConfidentialitePage() {
  return (
    <LegalPage eyebrow="Confidentialité" title="Vos données, en clair" intro="Ce que Qualio garde, à quoi cela sert, qui y accède et comment tout supprimer. Vos avis ne sont visibles que de vous.">
      <LegalSection title="Qui est responsable">
        <p>Le responsable du traitement est <Fill value={LEGAL.publisher} />. Contact pour toute question sur vos données : <a href={`mailto:${LEGAL.email}`} className="underline">{LEGAL.email}</a>.</p>
      </LegalSection>
      <LegalSection title="Les données que nous traitons">
        <p><strong>Votre compte :</strong> adresse email, nom d’affichage si vous le renseignez, préférences de notification.</p>
        <p><strong>Vos projets et vos avis :</strong> le contenu des avis que vous saisissez, importez par CSV ou recevez par le widget, avec le nom ou l’email de leur auteur lorsqu’il est fourni, et la date. Vous êtes responsable de pouvoir confier ces avis à Qualio.</p>
        <p><strong>Le fonctionnement du service :</strong> adresse IP et empreinte technique des envois du widget et de l’inscription, uniquement pour limiter les abus ; journaux d’emails envoyés ; mesure de quelques étapes d’usage (première synthèse, abonnement).</p>
        <p><strong>Le paiement :</strong> traité par Stripe. Qualio ne voit ni ne conserve votre numéro de carte, seulement l’état de votre abonnement.</p>
      </LegalSection>
      <LegalSection title="À quoi cela sert">
        <p>Fournir le service : classer vos avis par thème, écrire la synthèse et les recommandations, envoyer l’email du lundi si vous l’avez accepté, gérer votre abonnement et protéger le service contre les abus. Nous ne vendons pas vos données et nous ne les utilisons pas pour de la publicité.</p>
      </LegalSection>
      <LegalSection title="Avec qui elles sont partagées">
        <p><strong>Un fournisseur d’IA</strong> reçoit le texte de vos avis pour les classer et écrire les recommandations, uniquement pour cet usage. Fournisseur actuel : <Fill value="Google (modèles Gemini)" />. Consultez ses conditions pour savoir s’il conserve ou réutilise les contenus transmis par API.</p>
        <p><strong>Supabase</strong> (base de données et connexion), <strong>Vercel</strong> (hébergement), <strong>Resend</strong> (envoi des emails) et <strong>Stripe</strong> (paiement) traitent des données pour notre compte. Certains sont situés hors de votre pays, notamment aux États-Unis.</p>
        <p>Nous ne communiquons vos données à une autorité que si la loi nous y oblige.</p>
      </LegalSection>
      <LegalSection title="Combien de temps">
        <p>Tant que votre compte existe. Un compte Gratuit n’est pas supprimé pour inactivité. Si vous repassez en Gratuit, vos avis sont conservés. Quand vous supprimez un projet ou votre compte, les données correspondantes sont supprimées de la base ; les sauvegardes techniques les effacent ensuite à leur rythme.</p>
      </LegalSection>
      <LegalSection title="Vos droits">
        <p>Vous pouvez accéder à vos données, les corriger, les exporter ou les supprimer. La suppression d’un projet ou du compte se fait depuis Réglages. Pour tout autre droit (accès, copie, opposition), écrivez-nous : nous répondons sous 30 jours. Les auteurs d’avis dont vous nous confiez les données peuvent aussi s’adresser à vous, ou à nous.</p>
      </LegalSection>
      <LegalSection title="Cookies">
        <p>Qualio utilise uniquement ce qui est nécessaire pour vous connecter et retenir vos préférences (thème, langue, projet choisi). Avec votre accord, Qualio mesure aussi les visites et clics essentiels du site dans un but d’amélioration. Aucun cookie publicitaire ni profilage.</p>
      </LegalSection>
      <LegalSection title="Si Qualio vous a écrit sans que vous soyez client">
        <p><strong>Pourquoi vous avez reçu un message :</strong> Qualio écrit à des professionnels (e-commerce, agences, entreprises SaaS) pour leur proposer d’analyser gratuitement leurs avis clients. Nous n’écrivons qu’à des adresses professionnelles publiées sur le site de l’entreprise ou dans un annuaire public (par exemple OpenStreetMap), lorsque notre proposition concerne son activité.</p>
        <p><strong>Les données concernées :</strong> votre adresse email professionnelle, votre nom et votre fonction lorsqu’ils sont publiés, le nom et le site de votre entreprise, et l’historique de nos échanges (envoi, livraison, clic sur le lien, réponse ou désinscription). Nous ne les achetons à personne et ne les revendons pas.</p>
        <p><strong>Pourquoi nous avons le droit de le faire :</strong> notre intérêt légitime à présenter notre service à des professionnels concernés. Vous pouvez vous y opposer à tout moment, sans motif.</p>
        <p><strong>Vous désinscrire :</strong> cliquez sur « Me désinscrire » en bas de l’email (un clic, sans compte), répondez « stop », ou écrivez à <a href={`mailto:${LEGAL.email}`} className="underline">{LEGAL.email}</a>. Nous gardons alors uniquement votre adresse dans une liste d’exclusion, pour être sûrs de ne plus vous écrire.</p>
        <p><strong>Combien de temps :</strong> si vous ne répondez pas, vos données sont supprimées au plus tard 3 ans après notre dernier message. Si vous demandez leur suppression, nous les effaçons, hormis l’adresse conservée pour respecter votre opposition.</p>
        <p><strong>Qui y accède :</strong> l’équipe Qualio, et nos prestataires techniques pour l’envoi et le stockage (Resend, Supabase, Vercel), dont certains sont situés hors de l’Union européenne. Vous pouvez aussi demander l’accès, la correction ou l’effacement de vos données, ou saisir l’autorité de protection des données de votre pays.</p>
      </LegalSection>
      <LegalSection title="Les emails">
        <p>L’email du lundi n’est envoyé que si vous l’avez accepté. Chaque message contient un lien de désinscription, et vous pouvez aussi le désactiver dans Réglages. Les messages de présentation envoyés aux professionnels non clients sont décrits dans la section précédente.</p>
      </LegalSection>
    </LegalPage>
  )
}
