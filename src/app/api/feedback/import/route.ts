import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

function parseCsv(input: string) {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false
  for (let index = 0; index < input.length; index += 1) { const char = input[index]; const next = input[index + 1]; if (char === '"' && quoted && next === '"') { cell += '"'; index += 1 } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { row.push(cell.trim()); cell = '' } else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && next === '\n') index += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = '' } else cell += char }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row) }
  return rows
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})); const siteId = typeof body.siteId === 'string' ? body.siteId : ''; const csv = typeof body.csv === 'string' ? body.csv : ''
  if (!siteId || !csv) return NextResponse.json({ error: 'siteId and csv are required' }, { status: 400 })
  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle(); if (!site) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  const rows = parseCsv(csv); if (rows.length < 2) return NextResponse.json({ error: 'Le fichier doit contenir un en-tête et au moins une ligne.' }, { status: 400 })
  const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, '_')); const contentIndex = headers.findIndex((header) => ['content', 'feedback', 'avis', 'comment', 'commentaire', 'message'].includes(header)); if (contentIndex < 0) return NextResponse.json({ error: 'Ajoutez une colonne content, avis, feedback ou commentaire.' }, { status: 400 })
  const authorIndex = headers.findIndex((header) => ['author_name', 'name', 'nom', 'auteur'].includes(header)); const emailIndex = headers.findIndex((header) => ['author_email', 'email', 'e-mail'].includes(header)); const values = rows.slice(1).map((values) => ({ user_id: user.id, site_id: siteId, source: 'csv', content: values[contentIndex]?.slice(0, 10000), author_name: authorIndex >= 0 ? values[authorIndex]?.slice(0, 160) || null : null, author_email: emailIndex >= 0 ? values[emailIndex]?.slice(0, 320) || null : null })).filter((value) => value.content)
  if (!values.length) return NextResponse.json({ error: 'Aucun avis exploitable trouvé.' }, { status: 400 })
  const { error } = await (supabase as any).from('feedback_items').insert(values); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ imported: values.length, skipped: rows.length - 1 - values.length })
}
