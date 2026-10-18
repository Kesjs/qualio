import { describe, expect, it } from 'vitest'
import { LIFECYCLE_STAGES } from '@/lib/email/lifecycle'
import { isMarketingType, LIFECYCLE_EMAIL_TYPES, MARKETING_TYPES, WEEKLY_CAP_COUNTED_TYPES } from '@/lib/email/policy'
import { activationNudgeEmail, decisionReminderEmail, feedbackRequestEmail, projectNudgeEmail } from '@/lib/email/templates'

describe('relances de cycle de vie', () => {
  it('chaque étape est un type marketing, donc soumis au plafond hebdomadaire', () => {
    for (const { stage } of LIFECYCLE_STAGES) {
      expect(isMarketingType(stage)).toBe(true)
      expect(WEEKLY_CAP_COUNTED_TYPES).toContain(stage)
      expect(LIFECYCLE_EMAIL_TYPES).toContain(stage)
    }
  })

  it('le plafond compte tout le marketing sauf la bienvenue', () => {
    expect(WEEKLY_CAP_COUNTED_TYPES).not.toContain('welcome')
    expect(WEEKLY_CAP_COUNTED_TYPES.length).toBe(MARKETING_TYPES.length - 1)
  })

  it('les fenêtres sont cohérentes', () => {
    for (const { minDays, maxDays } of LIFECYCLE_STAGES) expect(minDays).toBeLessThan(maxDays)
  })

  it('chaque relance contient un lien de désinscription et un bouton', () => {
    for (const build of [activationNudgeEmail, projectNudgeEmail, feedbackRequestEmail, decisionReminderEmail]) {
      const email = build({ origin: 'https://app.test', userId: '00000000-0000-0000-0000-000000000000' })
      expect(email.html).toContain('/unsubscribe?token=')
      expect(email.text).toContain('https://app.test/dashboard')
    }
  })

  it('les nouvelles relances ont les objets validés', () => {
    const base = { origin: 'https://app.test', userId: '00000000-0000-0000-0000-000000000000' }
    expect(projectNudgeEmail(base).subject).toBe('Votre projet attend ses premiers avis')
    expect(decisionReminderEmail(base).subject).toBe('Une décision vous attend dans Qualio')
  })
})
