import { describe, expect, it } from 'vitest'
import { AUTO_REPLY_SUBJECT, STOP_SUBJECT, buildProspectMail } from '@/lib/admin/acquisition-mail'
import { createProspectUnsubscribeToken, createUnsubscribeToken, verifyProspectUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/email/unsubscribe'

const ID = '123e4567-e89b-12d3-a456-426614174000'

describe('jeton de désinscription prospect', () => {
  it('retrouve le message', () => expect(verifyProspectUnsubscribeToken(createProspectUnsubscribeToken(ID))).toBe(ID))
  it('refuse un jeton altéré', () => expect(verifyProspectUnsubscribeToken(`${createProspectUnsubscribeToken(ID)}x`)).toBeNull())
  it('ne se mélange pas avec le jeton des utilisateurs', () => {
    expect(verifyProspectUnsubscribeToken(createUnsubscribeToken('user-1'))).toBeNull()
    expect(verifyUnsubscribeToken(createProspectUnsubscribeToken(ID))).toBeNull()
  })
})

describe('email de prospection', () => {
  const mail = buildProspectMail({ messageId: ID, subject: 'Sujet', body: 'Bonjour,\n\nTest.', from: 'a@b.fr' })
  it('porte la désinscription en un clic (RFC 8058)', () => {
    expect(mail.headers['List-Unsubscribe']).toMatch(/^<https:\/\/.+\/api\/acquisition\/unsubscribe\?token=.+>, <mailto:.+\?subject=stop>$/)
    expect(mail.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
  })
  it('affiche le lien dans la version html et texte', () => {
    expect(mail.html).toContain('/desinscription?token=')
    expect(mail.text).toContain('/desinscription?token=')
    expect(mail.text).toContain('/confidentialite')
  })
})

describe('réponses entrantes', () => {
  it('reconnaît un stop', () => {
    expect(STOP_SUBJECT.test('stop')).toBe(true)
    expect(STOP_SUBJECT.test('Re: STOP')).toBe(true)
    expect(STOP_SUBJECT.test('Désinscription')).toBe(true)
    expect(STOP_SUBJECT.test('Re: Une question sur vos retours clients')).toBe(false)
    expect(STOP_SUBJECT.test('Stopover à Lisbonne')).toBe(false)
  })
  it('reconnaît une réponse automatique', () => {
    expect(AUTO_REPLY_SUBJECT.test('Réponse automatique : Une question')).toBe(true)
    expect(AUTO_REPLY_SUBJECT.test('Out of office')).toBe(true)
    expect(AUTO_REPLY_SUBJECT.test('Re: Une question sur vos retours clients')).toBe(false)
  })
})
