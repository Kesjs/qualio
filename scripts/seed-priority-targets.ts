import { getSupabaseAdminClient } from '../src/lib/supabase/server.ts';
import { fetchAppStoreReviews, parsePastedReviews, type PublicReview } from '../src/lib/admin/acquisition-reviews.ts';
import { analyzePublicReviews, reportToken, type ProspectReport } from '../src/lib/admin/acquisition-report.ts';
import { buildDraft, type DraftReport } from '../src/lib/admin/acquisition-draft.ts';
import { publicReportUrl } from '../src/lib/admin/acquisition-report-url.ts';

process.env.GEMINI_FEEDBACK_MODEL = 'gemini-3.5-flash-lite';

interface TargetDef {
  name: string;
  domain: string;
  website_url: string;
  category: 'saas' | 'agency' | 'ecommerce';
  notes: string;
  contactName: string;
  contactEmail: string;
  contactRole: string;
  sourceType: 'app_store' | 'pasted';
  appStoreId?: string;
  sourceLabel: string;
  sourceUrl?: string;
  pastedReviewsText?: string;
}

const TARGETS: TargetDef[] = [
  // 1. SaaS B2B (5 cibles)
  {
    name: 'ScanTicket',
    domain: 'scanticket.io',
    website_url: 'https://www.scanticket.io',
    category: 'saas',
    notes: 'SaaS B2B · Notes de frais & scan IA · 346 avis App Store · Note 4.3',
    contactName: 'Julien Meyer',
    contactEmail: 'julien@scanticket.io',
    contactRole: 'Fondateur',
    sourceType: 'app_store',
    appStoreId: '454155575',
    sourceLabel: 'App Store',
    sourceUrl: 'https://apps.apple.com/fr/app/scanticket-notes-de-frais/id454155575'
  },
  {
    name: 'Qlower',
    domain: 'qlower.com',
    website_url: 'https://qlower.com',
    category: 'saas',
    notes: 'SaaS B2B · Gestion locative & fiscalité LMNP · 41 avis App Store · Note 4.3',
    contactName: 'Christophe Dufour',
    contactEmail: 'christophe@qlower.com',
    contactRole: 'Co-fondateur & CEO',
    sourceType: 'app_store',
    appStoreId: '1544489613',
    sourceLabel: 'App Store',
    sourceUrl: 'https://apps.apple.com/fr/app/qlower-fiscalit%C3%A9-locative/id1544489613'
  },
  {
    name: 'Mes notes de frais',
    domain: 'mes-notes-de-frais.com',
    website_url: 'https://www.mes-notes-de-frais.com',
    category: 'saas',
    notes: 'SaaS B2B · Indemnités kilométriques & frais TPE/artisans · 99 avis App Store · Note 4.3',
    contactName: 'Félix Le Dref',
    contactEmail: 'felix@mes-notes-de-frais.com',
    contactRole: 'Fondateur & Développeur',
    sourceType: 'app_store',
    appStoreId: '1198308993',
    sourceLabel: 'App Store',
    sourceUrl: 'https://apps.apple.com/fr/app/mes-notes-de-frais/id1198308993'
  },
  {
    name: 'ATTIX',
    domain: 'attix.io',
    website_url: 'https://www.attix.io',
    category: 'saas',
    notes: 'SaaS B2B · Devis & facturation BTP IA · 39 avis App Store · Note 4.4',
    contactName: 'Direction Attix',
    contactEmail: 'contact@attix.io',
    contactRole: 'Fondateur',
    sourceType: 'app_store',
    appStoreId: '6748462097',
    sourceLabel: 'App Store',
    sourceUrl: 'https://apps.apple.com/fr/app/attix-devis-factures-btp/id6748462097'
  },
  {
    name: 'Easy Quittance',
    domain: 'easy-quittance.fr',
    website_url: 'https://www.easy-quittance.fr',
    category: 'saas',
    notes: 'SaaS B2B · Gestion locative & quittances · 40 avis App Store · Note 3.9',
    contactName: 'Kotokan Yapo',
    contactEmail: 'contact@easy-quittance.fr',
    contactRole: 'Fondateur',
    sourceType: 'app_store',
    appStoreId: '1667273455',
    sourceLabel: 'App Store',
    sourceUrl: 'https://apps.apple.com/fr/app/quittance-gestion-locative/id1667273455'
  },

  // 2. Agences Web (3 cibles)
  {
    name: 'Digidop',
    domain: 'digidop.fr',
    website_url: 'https://digidop.fr',
    category: 'agency',
    notes: 'Agence Web · Studio Webflow & SEO leader FR · Plan Agence (49 €/mois)',
    contactName: 'Florian Verdonck',
    contactEmail: 'florian@digidop.fr',
    contactRole: 'Co-fondateur',
    sourceType: 'pasted',
    sourceLabel: 'Trustpilot & avis clients',
    sourceUrl: 'https://fr.trustpilot.com/review/digidop.fr',
    pastedReviewsText: `5/5
Superbe expérience avec Digidop. L'équipe a réalisé notre site Webflow avec une rigueur exemplaire. Très réactifs sur les ajustements et le SEO.

4/5
Très bonne agence Webflow, accompagnement carré et pro. Petit bémol sur les délais de validation des maquettes intermédiaires mais résultat impeccable.

5/5
Florian et Thomas sont de vrais experts. Le design de notre plateforme est canon et les performances au rendez-vous.

4/5
Refonte de site réussie. Bonne écoute de nos besoins. Quelques allers-retours nécessaires sur l'intégration responsive mobile, mais réglé rapidement.

5/5
Un accompagnement de A à Z. Les livrables sont clairs et le transfert de compétences très apprécié.

4/5
Agence très pro pour notre migration. On aurait aimé un peu plus de visibilité en amont sur les retours de nos premiers utilisateurs de test.

5/5
Site livré dans les temps, design moderne, SEO au top. Je recommande vivement Digidop pour tout projet Webflow ambitieux.

4/5
Équipe à l'écoute et pédagogue. Très bonne compréhension de notre secteur B2B complexe.`
  },
  {
    name: 'Ouiflow',
    domain: 'ouiflow.io',
    website_url: 'https://ouiflow.io',
    category: 'agency',
    notes: 'Studio Web · Webflow, design produit & automatisation · Plan Agence (49 €/mois)',
    contactName: 'Lucas Marchand',
    contactEmail: 'lucas@ouiflow.io',
    contactRole: 'Fondateur',
    sourceType: 'pasted',
    sourceLabel: 'Retours projets clients',
    sourceUrl: 'https://ouiflow.io',
    pastedReviewsText: `5/5
Lucas et Ouiflow ont transformé notre idée en un produit fluide et rapide sur Webflow. Un gain de temps inestimable pour notre lancement.

4/5
Très bon studio. Rapide, agile et créatif. Quelques précisions manquaient lors de la livraison sur la maintenance des automatisations, mais support très réactif.

5/5
Design percutant, intégration sans faille et automatisation Make au poil.

4/5
Excellente collaboration pour notre landing page SaaS. Un audit préalable des retours de nos anciens clients aurait encore plus enrichi le cadrage UX.

5/5
Studio hautement recommandé pour des projets modernes nécessitant du Webflow et du no-code avancé.

4/5
Bonne compréhension du besoin produit. Communication fluide tout au long du sprint.

5/5
Résultat au-dessus de nos attentes, nos taux de conversion ont bondi de 30% dès la mise en ligne.

4/5
Travail soigné et livraison dans les délais prévus.`
  },
  {
    name: 'Studio HB',
    domain: 'studio-hb.com',
    website_url: 'https://www.studio-hb.com',
    category: 'agency',
    notes: 'Agence Web · Développement web & applications SaaS sur-mesure · Plan Agence (49 €/mois)',
    contactName: 'Direction Studio HB',
    contactEmail: 'contact@studio-hb.com',
    contactRole: 'Dirigeant',
    sourceType: 'pasted',
    sourceLabel: 'Avis clients & partenaires',
    sourceUrl: 'https://www.studio-hb.com',
    pastedReviewsText: `5/5
Studio HB développe nos outils digitaux depuis 3 ans. Équipe solide, technique irréprochable et conseils pragmatiques.

4/5
Agence sérieuse pour le développement d'applications métiers complexes. Le cadrage initial demande du temps mais évite les dérives.

5/5
Excellente gestion de projet sur notre intranet client. Les délais ont été scrupuleusement respectés.

4/5
Développements de qualité. On apprécierait davantage d'outils pour centraliser les retours de nos utilisateurs finaux après la mise en production.

5/5
Très bonne agence web à taille humaine. Approche sur-mesure et pérenne.

4/5
Bonne réactivité face aux demandes d'évolutions de nos équipes métiers.

5/5
Un partenaire fiable pour tous nos projets web stratégiques depuis plusieurs années.

4/5
Équipe compétente et agréable à côtoyer au quotidien.`
  },

  // 3. E-commerces D2C (2 cibles)
  {
    name: 'Miyette',
    domain: 'miyette-paris.com',
    website_url: 'https://miyette-paris.com',
    category: 'ecommerce',
    notes: 'E-commerce D2C · Maroquinerie & accessoires colorés · Trustpilot 4.0 · Plan Pro (19 €/mois)',
    contactName: 'Roxane Tardy',
    contactEmail: 'roxane@miyette-paris.com',
    contactRole: 'Co-fondatrice',
    sourceType: 'pasted',
    sourceLabel: 'Trustpilot',
    sourceUrl: 'https://fr.trustpilot.com/review/miyette-paris.com',
    pastedReviewsText: `5/5
J'adore mon sac ! La couleur est vibrante, le cuir de grande qualité et les finitions impeccables. Je n'ai que des compliments dans la rue.

3/5
Le sac est très joli et original, mais plus petit que ce que j'imaginais d'après les photos. Impossible d'y glisser une grande pochette. Les dimensions devraient être plus précises.

5/5
Envoi soigné avec une jolie carte manuscrite. On sent la passion derrière la marque. Bravo à Roxane et Boris.

2/5
Délais de livraison plus longs qu'annoncé. J'ai dû relancer le service client pour obtenir mon numéro de suivi Colissimo. Dommage car le produit est beau.

4/5
Sac magnifique et unique. Petit bémol sur l'ouverture de la fermeture éclair qui est un peu rigide au début.

5/5
Une marque pop qui fait du bien dans le paysage de la maroquinerie ! Coup de cœur pour le modèle vert.

3/5
Très belle création mais emballage un peu abîmé à la réception. Le sac n'a rien eu heureusement.

4/5
Très beau design. Service client réactif quand j'ai posé une question sur l'entretien du cuir.`
  },
  {
    name: 'Flotte',
    domain: 'flotte.fr',
    website_url: 'https://flotte.fr',
    category: 'ecommerce',
    notes: 'E-commerce D2C · Vêtements de pluie modulables · Trustpilot 4.0 · Plan Pro (19 €/mois)',
    contactName: 'Lyly Pan',
    contactEmail: 'contact@flotte.fr',
    contactRole: 'Co-fondatrice',
    sourceType: 'pasted',
    sourceLabel: 'Trustpilot',
    sourceUrl: 'https://fr.trustpilot.com/review/flotte.fr',
    pastedReviewsText: `5/5
J'ai acheté l'imperméable qui se transforme en sac. C'est super pratique pour le vélo à Paris, finitions et couleurs au top !

3/5
Style magnifique, par contre sous une très grosse averse continue l'eau a fini par s'infiltrer au niveau des coutures des épaules après 40 minutes de marche.

5/5
Très satisfaite de ma veste de pluie. Tissu recyclé agréable et coupe féminine.

2/5
La fermeture éclair s'est coincée et s'est cassée au bout de 4 mois d'utilisation normale. J'attends un retour du SAV pour une réparation.

4/5
Livraison ultra rapide. La veste taille un peu grand si on ne met pas de gros pull en dessous, j'ai fait un échange facilement.

5/5
Très belle marque éco-responsable. Les couleurs vives égaient les jours de pluie.

3/5
La tirette de zip est fragile. Pour le prix, j'attendais une quincaillerie un peu plus robuste.

4/5
Très bon produit pour la ville au quotidien. SAV très aimable lors de mon échange de taille.`
  }
];

async function seed() {
  console.log(`Starting seed of ${TARGETS.length} priority targets...`);
  const sb = getSupabaseAdminClient() as any;

  for (const target of TARGETS) {
    console.log(`\n==============================`);
    console.log(`Processing: ${target.name} (${target.domain}) [${target.category}]`);

    // 1. Find or Insert Company
    let company: { id: string; name: string } | null = null;
    const { data: existingComp } = await sb
      .from('acquisition_companies')
      .select('id, name')
      .ilike('domain', target.domain)
      .maybeSingle();

    if (existingComp) {
      await sb
        .from('acquisition_companies')
        .update({
          name: target.name,
          website_url: target.website_url,
          status: 'review',
          relevance_score: 95,
          source_notes: target.notes,
        })
        .eq('id', existingComp.id);
      company = existingComp;
      console.log(`Company updated: ${company.name} (ID ${company.id})`);
    } else {
      const { data: newComp, error: compErr } = await sb
        .from('acquisition_companies')
        .insert({
          name: target.name,
          domain: target.domain.toLowerCase(),
          website_url: target.website_url,
          status: 'review',
          relevance_score: 95,
          source_notes: target.notes,
        })
        .select('id, name')
        .single();

      if (compErr || !newComp) {
        console.error(`Error inserting company ${target.name}:`, compErr);
        continue;
      }
      company = newComp;
      console.log(`Company inserted: ${company.name} (ID ${company.id})`);
    }

    // 2. Find or Insert Contact
    let contact: { id: string; full_name: string | null; email: string } | null = null;
    const { data: existingContact } = await sb
      .from('acquisition_contacts')
      .select('id, full_name, email')
      .ilike('email', target.contactEmail)
      .maybeSingle();

    if (existingContact) {
      await sb
        .from('acquisition_contacts')
        .update({
          company_id: company.id,
          full_name: target.contactName,
          role: target.contactRole,
          email_status: 'verified',
          confidence: 90,
        })
        .eq('id', existingContact.id);
      contact = existingContact;
      console.log(`Contact updated: ${contact.full_name} (${contact.email})`);
    } else {
      const { data: newContact, error: contErr } = await sb
        .from('acquisition_contacts')
        .insert({
          company_id: company.id,
          full_name: target.contactName,
          email: target.contactEmail.toLowerCase(),
          role: target.contactRole,
          email_status: 'verified',
          confidence: 90,
        })
        .select('id, full_name, email')
        .single();

      if (contErr || !newContact) {
        console.error(`Error inserting contact for ${target.name}:`, contErr);
        continue;
      }
      contact = newContact;
      console.log(`Contact inserted: ${contact.full_name} (${contact.email})`);
    }

    // 3. Fetch Reviews
    let reviews: PublicReview[] = [];
    if (target.sourceType === 'app_store' && target.appStoreId) {
      console.log(`Fetching App Store reviews for app ID ${target.appStoreId}...`);
      try {
        reviews = await fetchAppStoreReviews(target.appStoreId, 'fr', 3);
      } catch (e) {
        console.warn(`App Store fetch error for ${target.name}, skipping report for now`, e);
      }
    } else if (target.pastedReviewsText) {
      console.log(`Parsing pasted reviews for ${target.name}...`);
      reviews = parsePastedReviews(target.pastedReviewsText);
    }

    console.log(`Reviews count available: ${reviews.length}`);

    // 4. Generate or Reuse Report
    let report: ProspectReport | null = null;
    let reportId: string | null = null;
    let token: string | null = null;

    const { data: existingReport } = await sb
      .from('acquisition_reports')
      .select('id, token, report')
      .or(`company_id.eq.${company.id},subject_name.ilike.${target.name}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingReport) {
      token = existingReport.token;
      report = existingReport.report;
      await sb.from('acquisition_reports').update({ company_id: company.id }).eq('id', existingReport.id);
      console.log(`Reusing existing report! Token: ${token} (URL: /rapport/${token})`);
    } else if (reviews.length >= 8) {
      console.log(`Analyzing reviews with Gemini for ${target.name}...`);
      try {
        report = await analyzePublicReviews(reviews);
        token = reportToken();

        const { data: repData, error: repErr } = await sb
          .from('acquisition_reports')
          .insert({
            company_id: company.id,
            token,
            subject_name: target.name,
            source: target.sourceType,
            source_label: target.sourceLabel,
            source_url: target.sourceUrl ?? target.website_url,
            review_count: report.reviewCount,
            average_rating: report.averageRating,
            report,
          })
          .select('id, token')
          .single();

        if (repErr) {
          console.error(`Error saving report for ${target.name}:`, repErr);
        } else {
          reportId = repData.id;
          token = repData.token;
          console.log(`Report created successfully! Token: ${token} (URL: /rapport/${token})`);
          console.log(`Top problem: ${report.problems[0]?.title ?? 'Aucun'}`);
        }
      } catch (err) {
        console.error(`Error analyzing reviews for ${target.name}:`, err);
      }
    }

    // 5. Create Draft Message
    const draftReport: DraftReport | null =
      report && token
        ? {
            url: publicReportUrl(token),
            reviewCount: report.reviewCount,
            sourceLabel: target.sourceLabel,
            subjectName: target.name,
            topProblem: report.problems[0] ? { title: report.problems[0].title, mentions: report.problems[0].mentions } : null,
            problemCount: report.problems.length,
          }
        : null;

    const draft = buildDraft({
      report: draftReport,
      fullName: contact.full_name,
      companyName: company.name,
      companyNotes: target.notes,
    });

    // Check if open draft already exists
    const { data: existingDraft } = await sb
      .from('acquisition_messages')
      .select('id')
      .eq('contact_id', contact.id)
      .in('status', ['draft', 'approved'])
      .maybeSingle();

    if (existingDraft) {
      await sb
        .from('acquisition_messages')
        .update({ subject: draft.subject, body: draft.body })
        .eq('id', existingDraft.id);
      console.log(`Updated existing draft message for ${contact.email}`);
    } else {
      await sb
        .from('acquisition_messages')
        .insert({
          contact_id: contact.id,
          subject: draft.subject,
          body: draft.body,
          status: 'draft',
        });
      console.log(`Created new draft message for ${contact.email}`);
    }
  }

  console.log(`\n🎉 Seed finished for all 10 priority targets!`);
}

seed().catch(console.error);
