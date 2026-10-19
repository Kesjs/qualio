import { after, NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { getFeedbackCapacity, getUserPlan, isSiteWritable, READ_ONLY_MESSAGE } from '@/lib/billing/limits'
import { classifyAndSaveFeedback } from '@/lib/feedback/classify'
import { analyzeCsv, CSV_MAX_BYTES } from '@/lib/csv'

const MAX_CONTENT_LENGTH = 2000

function normalizeHeader(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').replace(/\s+/g, '_')
}

function csvDate(value: string | undefined) {
  if (!value) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { siteId?: unknown; csv?: unknown } | null
  const siteId = typeof body?.siteId === 'string' ? body.siteId.trim() : ''
  const csv = typeof body?.csv === 'string' ? body.csv.replace(/^\uFEFF/, '') : ''
  if (!siteId || !csv) return NextResponse.json({ error: 'Choisissez un projet et un fichier CSV.' }, { status: 400 })
  if (new TextEncoder().encode(csv).byteLength > CSV_MAX_BYTES) return NextResponse.json({ error: 'Le fichier CSV ne doit pas dépasser 5 Mo.' }, { status: 413 })

  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  const analysis = analyzeCsv(csv)
  if (analysis.errors.length) {
    const reasons = analysis.errors.map((issue) => ({ line: issue.line ?? 0, reason: issue.message }))
    return NextResponse.json({ error: analysis.errors[0].message, imported: 0, reasons }, { status: analysis.errors[0].line === null ? 400 : 422 })
  }
  const rows = [analysis.headers, ...analysis.rows.map((row) => row.cells)]
  const lineOf = (offset: number) => analysis.rows[offset].line
  const headers = rows[0].map(normalizeHeader)
  const contentIndex = headers.findIndex((header) => ['content', 'feedback', 'avis', 'comment', 'commentaire', 'message'].includes(header))
  if (contentIndex < 0) return NextResponse.json({ error: 'La colonne content est obligatoire. author_name, created_at et source sont facultatives.' }, { status: 400 })
  const authorIndex = headers.findIndex((header) => ['author_name', 'name', 'nom', 'auteur'].includes(header))
  const emailIndex = headers.findIndex((header) => ['author_email', 'email', 'e-mail'].includes(header))
  const dateIndex = headers.findIndex((header) => ['created_at', 'date', 'created', 'date_creation'].includes(header))
  const sourceIndex = headers.findIndex((header) => ['source', 'origine'].includes(header))
  const plan = await getUserPlan(supabase, user.id)
  if (!(await isSiteWritable(supabase, user.id, siteId, plan))) return NextResponse.json({ error: READ_ONLY_MESSAGE, quota: 'read_only', plan }, { status: 403 })
  const capacity = await getFeedbackCapacity(supabase, siteId, plan)
  const rowsToImport: Record<string, unknown>[] = []
  const reasons: Array<{ line: number; reason: string }> = []
  rows.slice(1).forEach((values, offset) => {
    const line = lineOf(offset)
    const content = values[contentIndex]?.trim() ?? ''
    if (!content) return reasons.push({ line, reason: 'content vide' })
    if (content.length > MAX_CONTENT_LENGTH) return reasons.push({ line, reason: `content dépasse ${MAX_CONTENT_LENGTH} caractères` })
    const date = csvDate(values[dateIndex])
    if (values[dateIndex] && !date) return reasons.push({ line, reason: 'created_at invalide' })
    const source = (values[sourceIndex] ?? '').trim().slice(0, 40) || 'csv'
    rowsToImport.push({ user_id: user.id, site_id: siteId, source: 'csv', content, author_name: (values[authorIndex] ?? '').trim().slice(0, 160) || null, author_email: (values[emailIndex] ?? '').trim().slice(0, 320) || null, created_at: date ?? new Date().toISOString(), metadata: { imported_source: source, classification_status: 'pending' } })
  })
  // Doc 3.5 : on importe jusqu'à la limite du plan, le reste est ignoré avec la raison.
  let overflowCount = 0
  if (rowsToImport.length > capacity.remaining) {
    overflowCount = rowsToImport.length - capacity.remaining
    rowsToImport.splice(capacity.remaining)
    reasons.push({ line: 0, reason: `${overflowCount} avis ignoré${overflowCount > 1 ? 's' : ''} : la limite de ${capacity.limit.toLocaleString('fr-FR')} avis par projet de votre plan est atteinte` })
  }
  if (!rowsToImport.length) {
    const nextStep = plan === 'free' ? 'Passez à Pro pour augmenter votre capacité.' : plan === 'pro' ? 'Archivez des avis ou passez à Agence pour augmenter votre capacité.' : 'Archivez des avis ou contactez Qualio pour une capacité adaptée.'
    return NextResponse.json({ error: overflowCount > 0 ? `Aucun avis importé : vous avez atteint ${capacity.limit.toLocaleString('fr-FR')} avis. ${nextStep}` : 'Aucun avis valide dans ce fichier.', imported: 0, skipped: rows.length - 1, reasons, limit: capacity.limit, plan, limitReached: overflowCount > 0 }, { status: 422 })
  }
  const { data: inserted, error } = await (supabase as any).from('feedback_items').insert(rowsToImport).select('id, site_id, content')
  if (error) return NextResponse.json({ error: 'Les avis n’ont pas pu être importés. Aucun fichier supplémentaire n’a été créé.' }, { status: 500 })
  if (inserted?.length) after(async () => {
    const batchSize = 100
    for (let offset = 0; offset < inserted.length; offset += batchSize) {
      const batch = inserted.slice(offset, offset + batchSize)
      await Promise.all(batch.map(async (item: { id: string; site_id: string; content: string }) => {
        try { await classifyAndSaveFeedback(getSupabaseAdminClient(), item.id, item.site_id, item.content) } catch (classificationError) { console.error('[Feedback import] async classification failed', classificationError) }
      }))
    }
  })
  return NextResponse.json({ imported: rowsToImport.length, skipped: rows.length - 1 - rowsToImport.length, reasons, limit: capacity.limit, plan, limitReached: overflowCount > 0, overflow: overflowCount })
}
