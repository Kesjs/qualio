import { after, NextRequest, NextResponse } from 'next/server'
import { classifyPendingFeedback } from '@/lib/feedback/classify'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'

const EXAMPLES = [
  'La prise en main est simple, mais je ne comprends pas toujours la prochaine étape.',
  'J’ai trouvé la recherche rapide et les résultats faciles à lire.',
  'Le temps de chargement augmente quand je consulte beaucoup d’éléments.',
  'J’aimerais pouvoir exporter la synthèse pour la partager avec mon équipe.',
  'Le bouton principal est clair sur mobile.',
  'Je ne sais pas si mon changement a bien été enregistré après validation.',
  'Les filtres sont utiles, mais ils sont difficiles à trouver.',
  'Le prix est correct si les recommandations restent concrètes.',
  'J’ai dû recommencer deux fois car un message d’erreur n’expliquait pas quoi faire.',
  'La vue d’ensemble m’aide à voir les sujets qui reviennent le plus.',
  'Je voudrais recevoir un rappel quand une action reste à décider.',
  'Le parcours fonctionne bien sur ordinateur, moins bien avec le clavier du téléphone.',
  'Les avis sont utiles, mais les doublons devraient être regroupés.',
  'La synthèse m’a permis de comprendre rapidement les points prioritaires.',
  'Il manque une explication courte à côté de certains indicateurs.',
]

async function context() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await context()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { siteId?: unknown } | null
  const siteId = typeof body?.siteId === 'string' ? body.siteId : ''
  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  const { data: existing } = await (supabase as any).from('feedback_items').select('id').eq('user_id', user.id).eq('site_id', siteId).contains('metadata', { is_example: true }).limit(1)
  if (existing?.length) return NextResponse.json({ imported: 0, alreadyPresent: true })
  const { error } = await (supabase as any).from('feedback_items').insert(EXAMPLES.map((content, index) => ({ user_id: user.id, site_id: siteId, source: 'manual', content, author_name: `Exemple ${index + 1}`, theme: null, sentiment: null, confidence: null, metadata: { is_example: true, classification_status: 'pending' } })))
  if (error) return NextResponse.json({ error: 'Impossible de charger les avis d’exemple.' }, { status: 500 })
  // Les exemples n'étaient jamais classés : ni thème, ni sentiment, donc un écran Détails vide.
  after(async () => { try { await classifyPendingFeedback(getSupabaseAdminClient(), siteId) } catch (error) { console.error('[Feedback examples] classification failed', error) } })
  return NextResponse.json({ imported: EXAMPLES.length }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await context()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = request.nextUrl.searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  const { data: rows } = await (supabase as any).from('feedback_items').select('id, metadata').eq('user_id', user.id).eq('site_id', siteId)
  const ids = (rows ?? []).filter((row: { metadata?: { is_example?: boolean } }) => row.metadata?.is_example === true).map((row: { id: string }) => row.id)
  if (!ids.length) return NextResponse.json({ deleted: 0 })
  const { error } = await (supabase as any).from('feedback_items').delete().in('id', ids).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Impossible de supprimer les exemples.' }, { status: 500 })
  return NextResponse.json({ deleted: ids.length })
}
