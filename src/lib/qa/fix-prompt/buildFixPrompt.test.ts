import { describe, expect, it } from 'vitest'
import { buildFixPrompt, buildFixSummary } from './buildFixPrompt'

const base = {
  issue: { id: 'issue-1', title: 'CTA inactif', severity: 'major', category: 'cta' },
  context: {
    expected: 'Le clic ouvre /checkout', actual: 'Le clic ne change pas la page',
    repro_steps: ['Ouvrir /panier', 'Cliquer sur Commander'],
    locate_hints: ['Rechercher le texte Commander'], acceptance_check: 'Le clic ouvre /checkout sans erreur console',
    page_url: 'https://example.com/panier', viewport: { name: 'desktop', width: 1440, height: 900 },
    selector: '.checkout', visible_text: 'Commander', uncertainties: ['Cause technique non confirmée'],
  },
  evidence: [{ id: 'evidence-1', type: 'action', payload: { selector: '.checkout' } }],
  site: { url: 'https://example.com', environment: 'production', stack_type: 'nextjs' as const, repository_provider: 'github' as const },
}

describe('buildFixPrompt', () => {
  it('builds a stable six-part correction prompt', () => {
    const prompt = buildFixPrompt(base)
    expect(prompt).toContain('# Reproduction')
    expect(prompt).toContain('# Comportement attendu')
    expect(prompt).toContain('# Preuves Qualio')
    expect(prompt).toContain('# Pistes de localisation')
    expect(prompt).toContain('# Validation')
    expect(prompt).toContain('Qualio n’a pas accès au code source')
  })

  it('does not invent a filename when evidence is incomplete', () => {
    const prompt = buildFixPrompt({ ...base, evidence: [], site: { ...base.site, stack_type: 'unknown' as const } })
    expect(prompt).toContain('Aucune preuve exploitable')
    expect(prompt).not.toMatch(/Hero\.tsx|ligne 42/)
  })
})

describe('buildFixSummary', () => {
  it('builds a short, human-readable summary with the key facts', () => {
    const summary = buildFixSummary(base)
    expect(summary.split('\n')).toHaveLength(6)
    expect(summary).toContain('CTA inactif')
    expect(summary).toContain('Majeure')
    expect(summary).toContain('https://example.com/panier')
    expect(summary).toContain('Le clic ouvre /checkout')
    expect(summary).toContain('Le clic ne change pas la page')
    expect(summary).toContain('1 preuve jointe')
    expect(summary).toContain('aucun accès au dépôt')
  })

  it('truncates long expected/actual text instead of dumping the full paragraph', () => {
    const longText = 'x'.repeat(300)
    const summary = buildFixSummary({ ...base, context: { ...base.context, expected: longText, actual: longText } })
    expect(summary).toContain('…')
    expect(summary).not.toContain(longText)
  })

  it('falls back to the stack hint when no locate_hints are present', () => {
    const summary = buildFixSummary({ ...base, context: { ...base.context, locate_hints: [] } })
    expect(summary).toContain('Rechercher le texte visible ou le sélecteur dans app, pages et src/components.')
  })
})
