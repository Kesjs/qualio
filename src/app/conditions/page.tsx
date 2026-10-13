import type { Metadata } from 'next'
import { Fill, LEGAL, LegalPage, LegalSection } from '@/components/landing/legal'

export const metadata: Metadata = { title: 'Conditions d’utilisation — Qualio', description: 'Les règles d’utilisation de Qualio, les offres, le paiement et la résiliation.' }

export default function ConditionsPage() {
  return (
    <LegalPage eyebrow="Conditions" title="Les règles du jeu" intro="Ces conditions s’appliquent dès que vous créez un compte Qualio. Elles sont courtes et lisibles.">
      <LegalSection title="Le service">
        <p>Qualio transforme les avis de vos clients en recommandations sourcées : vous importez ou collectez des avis, le service les classe par thème et propose des décisions. Les recommandations sont une aide, pas une garantie de résultat : c’est vous qui décidez de ce que vous appliquez.</p>
      </LegalSection>
      <LegalSection title="Votre compte">
        <p>Un compte par adresse email. Vous êtes responsable de votre mot de passe et de ce qui se fait depuis votre compte. Vous devez avoir le droit de nous confier les avis que vous ajoutez.</p>
      </LegalSection>
      <LegalSection title="Offres et limites">
        <p><strong>Gratuit :</strong> sans limite de durée, sans carte bancaire. 1 projet, 50 avis par projet, 1 synthèse toutes les 14 jours, import CSV et saisie manuelle.</p>
        <p><strong>Pro :</strong> 19 € par mois ou 190 € par an (2 mois offerts). 5 projets, 2 000 avis par projet, synthèse automatique chaque semaine, 1 synthèse manuelle par jour et par projet, widget, email du lundi, historique des décisions.</p>
        <p>Ces limites sont appliquées par le service. Nous pouvons les faire évoluer pour l’avenir, en vous prévenant avant tout changement qui réduit votre offre payante.</p>
      </LegalSection>
      <LegalSection title="Paiement, renouvellement et résiliation">
        <p>Le Pro est un abonnement payé d’avance par Stripe, mensuel ou annuel, renouvelé automatiquement. Vous pouvez résilier à tout moment depuis le portail de facturation : l’abonnement reste actif jusqu’à la fin de la période payée, puis votre compte passe en Gratuit.</p>
        <p>Remboursement : <Fill value="les périodes déjà commencées ne sont pas remboursées. Pour un abonnement annuel, vous pouvez demander un remboursement complet dans les 14 jours suivant le paiement en écrivant à l’adresse de contact" />.</p>
        <p>Si vous repassez en Gratuit, rien n’est supprimé. Ce qui dépasse les limites du plan Gratuit reste visible en lecture seule jusqu’à ce que vous repassiez sous la limite.</p>
      </LegalSection>
      <LegalSection title="Usage acceptable">
        <p>Vous ne devez pas utiliser Qualio pour envoyer des contenus illégaux, pour contourner les limites du service, pour saturer le widget ou pour tenter d’accéder aux données d’autres comptes. Nous pouvons suspendre un compte qui le fait, après vous avoir écrit quand c’est possible.</p>
      </LegalSection>
      <LegalSection title="Vos contenus">
        <p>Vos avis restent à vous. Vous nous autorisez seulement à les traiter pour fournir le service, comme décrit dans la page Confidentialité.</p>
      </LegalSection>
      <LegalSection title="Disponibilité et responsabilité">
        <p>Nous faisons au mieux pour que Qualio soit disponible et exact, sans promettre une disponibilité continue. Une synthèse générée par une IA peut contenir des erreurs : vérifiez-la grâce aux avis cités. Dans la mesure permise par la loi, notre responsabilité est limitée au montant payé sur les 12 derniers mois.</p>
      </LegalSection>
      <LegalSection title="Changements, droit applicable">
        <p>Nous pouvons modifier ces conditions ; la date de mise à jour figure en haut de la page et les changements importants vous sont annoncés par email. Droit applicable et juridiction compétente : <Fill value={LEGAL.governingLaw} />.</p>
      </LegalSection>
    </LegalPage>
  )
}
