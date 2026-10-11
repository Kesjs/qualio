import { after, NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { BILLING_PLANS, resolvePlan } from '@/lib/billing/plans'
import { classifyAndSaveFeedback } from '@/lib/feedback/classify'

const MAX_CSV_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 5000
const MAX_CONTENT_LENGTH = 2000

function parseCsv(input: string, separator: ',' | ';') {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const next = input[index + 1]
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === separator && !quoted) { row.push(cell.trim()); cell = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []; cell = ''
    } else cell += char
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row) }
  return rows
}

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
  if (new TextEncoder().encode(csv).byteLength > MAX_CSV_BYTES) return NextResponse.json({ error: 'Le fichier CSV ne doit pas dépasser 5 Mo.' }, { status: 413 })

  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  const separator: ',' | ';' = (csv.split('\n')[0].split(';').length > csv.split('\n')[0].split(',').length) ? ';' : ','
  const rows = parseCsv(csv, separator)
  if (rows.length < 2) return NextResponse.json({ error: 'Le fichier doit contenir un en-tête et au moins une ligne.' }, { status: 400 })
  if (rows.length - 1 > MAX_ROWS) return NextResponse.json({ error: `Le fichier ne peut pas dépasser ${MAX_ROWS} lignes.` }, { status: 413 })

  const headers = rows[0].map(normalizeHeader)
  const contentIndex = headers.findIndex((header) => ['content', 'feedback', 'avis', 'comment', 'commentaire', 'message'].includes(header))
  if (contentIndex < 0) return NextResponse.json({ error: 'La colonne content est obligatoire. author_name, created_at et source sont facultatives.' }, { status: 400 })
  const authorIndex = headers.findIndex((header) => ['author_name', 'name', 'nom', 'auteur'].includes(header))
  const emailIndex = headers.findIndex((header) => ['author_email', 'email', 'e-mail'].includes(header))
  const dateIndex = headers.findIndex((header) => ['created_at', 'date', 'created', 'date_creation'].includes(header))
  const sourceIndex = headers.findIndex((header) => ['source', 'origine'].includes(header))
  const { data: billing } = await (supabase as any).from('billing_subscriptions').select('plan, status, source, trial_ends_at, current_period_end').eq('user_id', user.id).maybeSingle()
  const plan = resolvePlan(billing)
  const { count: currentCount } = await (supabase as any).from('feedback_items').select('id', { count: 'exact', head: true }).eq('site_id', siteId).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
  const rowsToImport: Record<string, unknown>[] = []
  const reasons: Array<{ line: number; reason: string }> = []
  rows.slice(1).forEach((values, offset) => {
    const line = offset + 2
    const content = values[contentIndex]?.trim() ?? ''
    if (!content) return reasons.push({ line, reason: 'content vide' })
    if (content.length > MAX_CONTENT_LENGTH) return reasons.push({ line, reason: `content dépasse ${MAX_CONTENT_LENGTH} caractères` })
    const date = csvDate(values[dateIndex])
    if (values[dateIndex] && !date) return reasons.push({ line, reason: 'created_at invalide' })
    const source = (values[sourceIndex] ?? '').trim().slice(0, 40) || 'csv'
    rowsToImport.push({ user_id: user.id, site_id: siteId, source: 'csv', content, author_name: (values[authorIndex] ?? '').trim().slice(0, 160) || null, author_email: (values[emailIndex] ?? '').trim().slice(0, 320) || null, created_at: date ?? new Date().toISOString(), metadata: { imported_source: source, classification_status: 'pending' } })
  })
  const available = Math.max(0, BILLING_PLANS[plan].monthlyFeedback - (currentCount ?? 0))
  if (rowsToImport.length > available) {
    const overflow = rowsToImport.splice(available)
    overflow.forEach((_, index) => reasons.push({ line: index + 2, reason: 'limite mensuelle du plan atteinte' }))
  }
  if (!rowsToImport.length) return NextResponse.json({ imported: 0, skipped: rows.length - 1, reasons }, { status: 422 })
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
  return NextResponse.json({ imported: rowsToImport.length, skipped: rows.length - 1 - rowsToImport.length, reasons })
}
