import { describe, expect, it } from 'vitest'
import { buildWeeklyDigestEmail } from '@/lib/email/weekly-digest'

const base = { origin: 'https://app.test', unsubscribeToken: 'a.b' }

describe('buildWeeklyDigestEmail', () => {
  it('un projet : l’objet porte le chiffre et la recommandation', () => {
    const email = buildWeeklyDigestEmail({ ...base, projects: [{ name: 'Boutique', newCount: 12, recommendation: { title: 'Clarifier la livraison' }, topTheme: 'Livraison' }] })
    expect(email.subject).toBe('12 nouveaux avis : Clarifier la livraison')
    expect(email.html).not.toContain('<h2')
    expect(email.html).toContain('https://app.test/dashboard')
    expect(email.html).toContain('/unsubscribe?token=a.b')
  })

  it('plusieurs projets : un seul email, une section par projet', () => {
    const email = buildWeeklyDigestEmail({ ...base, projects: [
      { name: 'Client A', newCount: 1, recommendation: { title: 'Réduire l’attente' }, topTheme: null },
      { name: 'Client B', newCount: 4, recommendation: null, topTheme: null },
    ] })
    expect(email.subject).toBe('5 nouveaux avis sur 2 projets cette semaine')
    expect(email.html).toContain('Client A')
    expect(email.html).toContain('Client B')
    expect(email.html).toContain('Pas assez de nouveaux avis')
    expect(email.text).toContain('Client B : Pas assez de nouveaux avis pour une synthèse.')
  })

  it('échappe le contenu venant des avis', () => {
    const email = buildWeeklyDigestEmail({ ...base, projects: [{ name: '<b>x</b>', newCount: 3, recommendation: { title: '<script>', rationale: '"&"' }, topTheme: '<i>' }] })
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })

  it('affiche les décisions et leur effet', () => {
    const email = buildWeeklyDigestEmail({ ...base, projects: [{ name: 'Boutique', newCount: 5, recommendation: { title: 'Clarifier la livraison' }, topTheme: null, decisions: [{ title: 'Raccourcir le formulaire', effect: 'effet mesuré dans 9 jours' }] }] })
    expect(email.html).toContain('Vos décisions')
    expect(email.html).toContain('effet mesuré dans 9 jours')
    expect(email.text).toContain('- Raccourcir le formulaire : effet mesuré dans 9 jours')
  })
})
