import type { Metadata } from 'next'
import { Fill, LEGAL, LegalPage, LegalSection } from '@/components/landing/legal'

export const metadata: Metadata = { title: 'Mentions légales — Qualio', description: 'Éditeur, hébergeur et contact du service Qualio.' }

export default function MentionsLegalesPage() {
  return (
    <LegalPage eyebrow="Mentions légales" title="Qui édite Qualio" intro="Les informations légales sur l’éditeur du site et du service, et sur son hébergement.">
      <LegalSection title="Éditeur">
        <p>Le site et le service Qualio sont édités par <Fill value={LEGAL.publisher} />, <Fill value={LEGAL.legalForm} />.</p>
        <p>Immatriculation : <Fill value={LEGAL.registration} />.</p>
        <p>Adresse : <Fill value={LEGAL.address} />.</p>
        <p>Directeur de la publication : <Fill value={LEGAL.director} />.</p>
        <p>Contact : <a href={`mailto:${LEGAL.email}`} className="underline">{LEGAL.email}</a>.</p>
      </LegalSection>
      <LegalSection title="Hébergement">
        <p>Le site est hébergé par {LEGAL.host}. Les données du service sont stockées chez Supabase, sur l’infrastructure d’un fournisseur de cloud.</p>
      </LegalSection>
      <LegalSection title="Propriété intellectuelle">
        <p>Le nom Qualio, le logo, les textes et le design du site appartiennent à l’éditeur. Vous ne pouvez pas les reproduire sans accord écrit. Les avis que vous importez ou collectez restent les vôtres.</p>
      </LegalSection>
      <LegalSection title="Signaler un contenu">
        <p>Pour signaler un contenu ou un problème, écrivez à l’adresse de contact ci-dessus. Nous répondons dans les meilleurs délais.</p>
      </LegalSection>
    </LegalPage>
  )
}
