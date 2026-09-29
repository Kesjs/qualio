import { describe, expect, it } from 'vitest'
import { buildFixPrompt } from './buildFixPrompt'

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
