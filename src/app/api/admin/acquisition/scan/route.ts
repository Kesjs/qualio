import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

const PATHS = ['', '/contact', '/feedback', '/reviews', '/support', '/changelog', '/jobs']
const SIGNALS = [
  { type: 'feedback', label: 'Collecte de feedback détectée', words: ['feedback', 'give us feedback', 'donnez votre avis', 'votre avis', 'customer feedback'] },
  { type: 'reviews', label: 'Avis ou témoignages détectés', words: ['reviews', 'avis clients', 'témoignages', 'testimonials', 'customer stories'] },
  { type: 'support', label: 'Support client détecté', words: ['support', 'help center', 'centre d’aide', 'customer success'] },
  { type: 'changelog', label: 'Changelog détecté', words: ['changelog', 'release notes', 'nouveautés', 'what’s new'] },
  { type: 'hiring', label: 'Recrutement lié au produit détecté', words: ['product manager', 'customer success', 'support specialist', 'head of product'] },
]

function safeUrl(domain: string, path: string) {
  const host = domain.replace(/^https?:\/\//, '').split('/')[0].trim().toLowerCase()
  if (!host || host === 'localhost' || host.startsWith('127.') || host.startsWith('192.168.') || host.startsWith('10.')) return null
  return `https://${host}${path}`
}

function textFromHtml(html: string) { return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120_000) }

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { companyId } = await request.json().catch(() => ({})) as { companyId?: string }
  if (!companyId) return NextResponse.json({ error: 'Entreprise manquante.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data: company, error: companyError } = await admin.from('acquisition_companies').select('id, name, domain').eq('id', companyId).maybeSingle()
  if (companyError || !company) return NextResponse.json({ error: 'Entreprise introuvable.' }, { status: 404 })
  const found: Array<{ signal_type: string; label: string; source_url: string; evidence: string; confidence: number }> = []
  const emails = new Set<string>()
  for (const path of PATHS) {
    const url = safeUrl(company.domain, path)
    if (!url) continue
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'QualioResearchBot/1.0 (+https://tryqualio.pro)' }, signal: AbortSignal.timeout(7000), cache: 'no-store' })
      if (!response.ok) continue
      const html = await response.text(); const text = textFromHtml(html); const lower = text.toLowerCase()
      for (const signal of SIGNALS) { const word = signal.words.find((candidate) => lower.includes(candidate.toLowerCase())); if (word) found.push({ signal_type: signal.type, label: signal.label, source_url: url, evidence: `Terme détecté : “${word}”`, confidence: 72 }) }
      for (const match of html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) { const email = match[0].toLowerCase(); if (!email.endsWith('.png') && !email.endsWith('.jpg')) emails.add(email) }
    } catch { /* page inaccessible: on conserve uniquement les sources accessibles */ }
  }
  const uniqueSignals = Array.from(new Map(found.map((signal) => [`${signal.signal_type}:${signal.source_url}`, signal])).values())
  if (uniqueSignals.length) await admin.from('acquisition_signals').insert(uniqueSignals.map((signal) => ({ ...signal, company_id: company.id })))
  for (const email of emails) {
    const { data: existing } = await admin.from('acquisition_contacts').select('id').eq('email', email).maybeSingle()
    if (!existing) await admin.from('acquisition_contacts').insert({ company_id: company.id, email, email_status: 'public', confidence: 65 })
  }
  const score = Math.min(100, uniqueSignals.length * 16 + (emails.size ? 15 : 0))
  await admin.from('acquisition_companies').update({ relevance_score: score, status: 'review', source_notes: `${uniqueSignals.length} signal(s), ${emails.size} email(s) public(s) détecté(s).` }).eq('id', company.id)
  return NextResponse.json({ signals: uniqueSignals.length, emails: emails.size, score })
}
