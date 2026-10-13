/** Textes de la landing (document de lancement V1, chapitre 4). Rien ici qui ne soit branché. */

export const REASSURANCE = ['Prêt en quelques minutes', 'Dès 3 avis', 'Sans carte bancaire', 'CSV ou widget']

export const PROBLEMS = [
  ['Éparpillés', 'Un CSV ici, un message là, un commentaire dans un outil de support. Personne n’a la vue d’ensemble.'],
  ['Trop longs à lire', 'Relire des centaines d’avis à la main prend des heures, alors on se fie aux trois derniers.'],
  ['Sans preuve', 'Une conclusion sans les avis qui la soutiennent ne convainc personne en réunion.'],
] as const

export const STEPS = [
  {
    n: '01',
    tag: 'Import',
    title: 'Importez vos avis existants.',
    body: 'Un fichier CSV suffit. Chaque avis garde sa date, sa source et son contexte, pour que l’historique serve dès le premier jour.',
  },
  {
    n: '02',
    tag: 'Collecte',
    title: 'Recueillez les prochains avis sur votre site (avec Pro).',
    body: 'Copiez un script, placez-le dans votre site. Vos clients donnent leur avis dans leur parcours, et il arrive dans le même espace.',
  },
  {
    n: '03',
    tag: 'Synthèse',
    title: 'Repérez ce qui revient, avec les avis à l’appui.',
    body: 'Qualio regroupe les thèmes récurrents et montre, pour chacun, les avis qui le justifient et leur nombre.',
  },
  {
    n: '04',
    tag: 'Décision',
    title: 'Votre équipe accepte, reporte ou écarte chaque recommandation.',
    body: 'Rien n’est appliqué automatiquement.',
  },
] as const

export const AUDIENCES = [
  {
    tag: 'Équipes produit',
    title: 'Les retours deviennent des décisions.',
    body: 'Import CSV, widget ou ajout manuel : Qualio réunit vos avis dans un espace classé par thème, pour que la réunion produit parte de faits.',
    chips: ['Import CSV', 'Widget', 'Ajout manuel'],
  },
  {
    tag: 'Agences et freelances',
    title: 'Un projet par client.',
    body: 'Chaque client a son espace avec ses sources, ses avis et ses recommandations. Vous voyez d’un coup d’œil ce qui remonte, projet par projet.',
    chips: ['Un espace par client', 'Sources', 'Recommandations'],
  },
  {
    tag: 'Boutiques en ligne',
    title: 'Voyez la friction avant qu’elle ne coûte des ventes.',
    body: 'Livraison, paiement, retours : repérez les sujets qui reviennent dans les avis et traitez d’abord ceux qui touchent le plus de clients.',
    chips: ['Livraison', 'Paiement', 'Retours'],
  },
] as const

/** Chaque ligne doit rester vraie : si une fonction n'est pas branchée, on retire la ligne. */
export const COMPARISON = [
  ['Avis cités à l’appui de chaque conseil', 'Selon ce que vous lui demandez', 'Oui, toujours'],
  ['Mémoire des avis d’une semaine à l’autre', 'Non, il faut tout recoller', 'Oui'],
  ['Collecte continue sur votre site', 'Non', 'Oui, avec le widget (Pro)'],
  ['Rappel chaque semaine', 'Non', 'Oui, par email (Pro)'],
  ['Suivi de ce que vous avez accepté ou écarté', 'Non', 'Oui'],
] as const

export const FAQ = [
  {
    q: 'Faut-il installer quelque chose sur mon site ?',
    a: 'Seulement si vous voulez le widget (avec Pro) : vous copiez un script et le placez dans votre site, sans modifier votre code. Sinon, rien à installer.',
  },
  {
    q: 'Puis-je importer mes anciens avis ?',
    a: 'Oui, par import CSV. Vos avis passés gardent leur date, leur source et leur contexte, et sont analysés avec les nouveaux.',
  },
  {
    q: 'Comment savoir d’où vient une synthèse ?',
    a: 'Chaque thème renvoie aux avis qui le justifient. Les faits et les éléments incertains sont séparés, pour que vous puissiez vérifier.',
  },
  {
    q: 'L’IA décide-t-elle à ma place ?',
    a: 'Non. Qualio propose des recommandations sourcées. Votre équipe accepte, reporte ou écarte chacune d’elles.',
  },
  {
    q: 'Combien coûte le plan gratuit ?',
    a: 'Rien, sans limite de durée. Il inclut 1 projet, 50 avis, une synthèse toutes les 14 jours, l’import CSV et la saisie manuelle.',
  },
  {
    // À confirmer avec les conditions du fournisseur d'IA choisi avant publication (doc 4.2), et à répéter dans la page Confidentialité.
    q: 'Mes avis restent-ils privés ?',
    a: 'Vos avis ne sont visibles que de vous. Pour écrire les recommandations, ils sont envoyés à un fournisseur d’IA, uniquement pour cet usage.',
  },
  {
    q: 'Que se passe-t-il si je quitte Pro ?',
    a: 'Vos données restent. Ce qui dépasse la limite du plan Gratuit passe en lecture seule.',
  },
] as const

/**
 * Témoignages : remplissez ce tableau avec de vrais retours (avec accord écrit, section 4.9).
 * Tant qu'il est vide, la bande « Bêta ouverte » prend sa place.
 */
export const TESTIMONIALS: { quote: string; name: string; role: string }[] = []
