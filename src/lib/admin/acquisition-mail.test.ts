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
  it('pointe le bouton principal vers /rapport/[token] quand le message contient un rapport', () => {
    const withReport = buildProspectMail({
      messageId: ID,
      subject: '80 avis App Store',
      body: 'Bonjour,\n\nVoici le rapport : https://tryqualio.pro/rapport/tok_1234567890123456',
      from: 'a@b.fr',
    })
    expect(withReport.html).toContain('Voir l’analyse de vos avis')
    expect(withReport.html).toContain('to=%2Frapport%2Ftok_1234567890123456')
  })
  it('ajoute la carte récap (image cliquable + priorités) quand un rapport est fourni, en échappant le contenu', () => {
    const card = {
      token: 'tok_1234567890123456',
      subjectName: 'App <b>Test</b>',
      sourceLabel: 'App Store',
      reviewCount: 120,
      averageRating: 3.8,
      distribution: [10, 8, 12, 40, 50],
      problems: [{ title: 'Synchronisation défaillante', mentions: 14 }, { title: 'Prix jugé trop élevé', mentions: 9 }],
      quote: { text: 'Impossible de synchroniser mes données', rating: 2 },
      reportUrl: 'https://tryqualio.pro/rapport/tok_1234567890123456',
      imageUrl: 'https://tryqualio.pro/api/acquisition/report-image?t=tok_1234567890123456',
    }
    const mail = buildProspectMail({ messageId: ID, subject: 'S', body: 'Bonjour,\n\nhttps://tryqualio.pro/rapport/tok_1234567890123456', from: 'a@b.fr', card })
    expect(mail.html).toContain('report-image?t=tok_1234567890123456')
    expect(mail.html).toContain('3,8/5')
    expect(mail.html).toContain('Synchronisation défaillante')
    expect(mail.html).not.toContain('<b>Test</b>')
    expect(mail.text).toContain('Prix jugé trop élevé')
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
