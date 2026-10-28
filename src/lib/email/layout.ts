import { LEGAL, senderIdentityLine, senderIdentityReady } from '@/lib/legal'
/** Mise en page commune des emails Qualio : texte écrit en dur, valeurs dynamiques toujours échappées. */

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char)
}

export function plural(count: number, one: string, many: string) {
  return `${count} ${count > 1 ? many : one}`
}

export function renderEmail(input: {
  heading: string
  lines: string[]
  cta?: { label: string; url: string }
  unsubscribeUrl?: string
}) {
  const ctaHtml = input.cta
    ? `<p style="margin-top:24px"><a href="${escapeHtml(input.cta.url)}" style="display:inline-block;background:#ee6018;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">${escapeHtml(input.cta.label)}</a></p>`
    : ''
  const unsubscribeHtml = input.unsubscribeUrl
    ? `<p style="font-size:12px;color:#666"><a href="${escapeHtml(input.unsubscribeUrl)}">Ne plus recevoir ces emails</a></p>`
    : ''
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171717"><p style="margin:0 0 28px"><img src="https://tryqualio.pro/qualio-logo/export/lockup/lockup-brand-dark-900.png" width="150" alt="Qualio" style="display:block;border:0" /></p><h1>${escapeHtml(input.heading)}</h1>${input.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}${ctaHtml}${unsubscribeHtml}<p style="margin-top:32px;font-size:12px;color:#777">Qualio — une vue fiable des avis qui comptent.</p></div>`
  const text = [
    input.heading,
    ...input.lines,
    input.cta ? `${input.cta.label} : ${input.cta.url}` : '',
    input.unsubscribeUrl ? `Ne plus recevoir ces emails : ${input.unsubscribeUrl}` : '',
  ].filter(Boolean).join('\n\n')
  return { html, text }
}

/** Template sobre pour les messages d'acquisition : rendu blanc, lisible dans Gmail et mobile.
 *  Le pied de page porte les mentions obligatoires d'un email commercial : qui envoie, où, pourquoi le destinataire reçoit ce message, comment se désinscrire. */
export function renderAcquisitionEmail(input: { subject: string; body: string; trackingUrl?: string; unsubscribeUrl?: string }) {
  const site = 'https://tryqualio.pro'
  // Ne jamais exposer un placeholder technique dans un email envoyé. Les informations
  // légales complètes restent à renseigner dans LEGAL avant une campagne réelle.
  const identity = senderIdentityReady() ? senderIdentityLine() : 'Qualio · tryqualio.pro · contact@tryqualio.pro'
  const reason = 'Vous recevez ce message parce que votre adresse professionnelle est publiée sur votre site ou dans un annuaire public, et que notre proposition concerne votre activité.'
  const optOut = 'Pour ne plus recevoir de message de notre part, répondez « stop » ou utilisez le lien ci-dessous.'
  const paragraphs = input.body.split(/\n{2,}/).map((paragraph) => {
    const safe = escapeHtml(paragraph).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#c94f12;font-weight:700">$1</a>')
    return `<p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#292524">${safe.replace(/\n/g, '<br />')}</p>`
  }).join('')
  const trackingCta = input.trackingUrl ? `<p style="margin:28px 0"><a href="${escapeHtml(input.trackingUrl)}" style="display:inline-block;background:#ee6018;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Découvrir Qualio</a></p>` : ''
  const unsubscribeLink = input.unsubscribeUrl ? `<p style="margin:10px 0 0;font-size:12px;line-height:1.5"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#78716c;text-decoration:underline">Me désinscrire</a> · <a href="${site}/confidentialite" style="color:#78716c;text-decoration:underline">Comment vos données sont utilisées</a></p>` : ''
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#292524"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #e7e2dc;border-radius:14px"><tr><td style="padding:30px 36px 18px;border-bottom:1px solid #eee9e3"><img src="${site}/qualio-logo/export/lockup/lockup-brand-dark-900.png" width="150" alt="Qualio" style="display:block;width:150px;height:auto;border:0" /></td></tr><tr><td style="padding:34px 36px 18px">${paragraphs}${trackingCta}</td></tr><tr><td style="padding:18px 36px 30px;border-top:1px solid #eee9e3"><p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#78716c">Message envoyé par ${escapeHtml(identity)}.</p><p style="margin:0;font-size:12px;line-height:1.5;color:#a8a29e">${escapeHtml(reason)} ${escapeHtml(optOut)}</p>${unsubscribeLink}</td></tr></table></td></tr></table></body></html>`
  const text = [
    input.body,
    '—',
    `Message envoyé par ${identity}.`,
    `${reason} ${optOut}`,
    input.unsubscribeUrl ? `Me désinscrire : ${input.unsubscribeUrl}` : '',
    `Vos données : ${site}/confidentialite · Contact : ${LEGAL.email}`,
  ].filter(Boolean).join('\n\n')
  return { html, text }
}
