import { LEGAL, senderIdentityLine, senderIdentityReady } from '@/lib/legal'
import type { ReportCard } from '@/lib/admin/acquisition-report-card'
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

const frNumber = (value: number) => value.toFixed(1).replace('.', ',')

/** Phrase de synthèse (aussi utilisée comme texte alternatif de l'image quand le client mail bloque les images). */
export function reportCardSummary(card: ReportCard) {
  const rating = card.averageRating != null ? `${frNumber(card.averageRating)}/5 · ` : ''
  return `${card.subjectName} — ${rating}${plural(card.reviewCount, 'avis analysé', 'avis analysés')} (${card.sourceLabel})`
}

/** Carte récapitulative : image cliquable + bloc texte. Le bloc texte reste lisible quand les images sont bloquées (cas courant en prospection à froid). */
function renderReportCardHtml(card: ReportCard, trackingUrl?: string) {
  const link = (inner: string) => (trackingUrl ? `<a href="${escapeHtml(trackingUrl)}" style="text-decoration:none;color:inherit">${inner}</a>` : inner)
  const image = link(`<img src="${escapeHtml(card.imageUrl)}" width="548" alt="${escapeHtml(reportCardSummary(card))}" style="display:block;width:100%;max-width:548px;height:auto;border:0;border-radius:10px" />`)
  const rows = card.problems.map((problem, index) => `<tr><td valign="top" style="padding:6px 10px 6px 0;font-size:14px;line-height:1.5;font-weight:700;color:#c2410c;width:18px">${index + 1}.</td><td style="padding:6px 0;font-size:14px;line-height:1.5;color:#292524">${escapeHtml(problem.title)} <span style="color:#78716c">· ${escapeHtml(plural(problem.mentions, 'avis', 'avis'))}</span></td></tr>`).join('')
  const quote = card.quote
    ? `<p style="margin:14px 0 0;padding:10px 14px;border-left:3px solid #fdba74;background:#fffaf6;font-size:14px;line-height:1.6;font-style:italic;color:#44403c">« ${escapeHtml(card.quote.text)} »${card.quote.rating != null ? ` <span style="font-style:normal;color:#78716c">(${card.quote.rating}/5)</span>` : ''}</p>`
    : ''
  const rating = card.averageRating != null ? `${escapeHtml(frNumber(card.averageRating))}/5 · ` : ''
  return `<div style="margin:0 0 8px">${image}<div style="margin-top:12px;padding:16px 18px;border:1px solid #e7e2dc;border-radius:10px"><p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#78716c">${rating}${escapeHtml(plural(card.reviewCount, 'avis analysé', 'avis analysés'))} (${escapeHtml(card.sourceLabel)}) · priorités repérées</p>${rows ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">${rows}</table>` : ''}${quote}</div></div>`
}

/** Template sobre pour les messages d'acquisition : rendu blanc, lisible dans Gmail et mobile.
 *  Le pied de page porte les mentions obligatoires d'un email commercial : qui envoie, où, pourquoi le destinataire reçoit ce message, comment se désinscrire. */
export function renderAcquisitionEmail(input: { subject: string; body: string; trackingUrl?: string; ctaLabel?: string; unsubscribeUrl?: string; card?: ReportCard | null }) {
  const site = 'https://tryqualio.pro'
  // Ne jamais exposer un placeholder technique dans un email envoyé. Les informations
  // légales complètes restent à renseigner dans LEGAL avant une campagne réelle.
  const identity = senderIdentityReady() ? senderIdentityLine() : 'Qualio · tryqualio.pro · contact@tryqualio.pro'
  const reason = 'Vous recevez ce message parce que votre adresse professionnelle est publiée sur votre site ou dans un annuaire public, et que notre proposition concerne votre activité.'
  const optOut = 'Pour ne plus recevoir de message de notre part, répondez « stop » ou utilisez le lien ci-dessous.'
  const hasReportLink = /\/rapport\/[\w-]+/.test(input.body)
  const buttonLabel = input.ctaLabel || (hasReportLink ? 'Voir l’analyse de vos avis' : 'Découvrir Qualio')
  const paragraphs = input.body.split(/\n{2,}/).map((paragraph) => {
    const safe = escapeHtml(paragraph).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#c2410c;font-weight:700">$1</a>')
    return `<p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#292524">${safe.replace(/\n/g, '<br />')}</p>`
  }).join('')
  const trackingCta = input.trackingUrl ? `<p style="margin:28px 0"><a href="${escapeHtml(input.trackingUrl)}" style="display:inline-block;background:#c2410c;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">${escapeHtml(buttonLabel)}</a></p>` : ''
  const cardHtml = input.card ? renderReportCardHtml(input.card, input.trackingUrl) : ''
  const unsubscribeLink = input.unsubscribeUrl ? `<a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#57534e;text-decoration:underline">Me désinscrire</a>` : ''
  const footerLinks = [unsubscribeLink, `<a href="${site}/confidentialite" style="color:#57534e;text-decoration:underline">Confidentialité</a>`].filter(Boolean).join(' · ')
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#292524"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #e7e2dc;border-radius:14px"><tr><td style="padding:30px 36px 18px;border-bottom:1px solid #eee9e3"><img src="${site}/qualio-logo/export/lockup/lockup-brand-dark-900.png" width="150" alt="Qualio" style="display:block;width:150px;height:auto;border:0" /></td></tr><tr><td style="padding:34px 36px 18px">${paragraphs}${cardHtml}${trackingCta}</td></tr><tr><td style="padding:26px 36px 30px;border-top:1px solid #eee9e3;background:#f5f5f4"><p style="margin:0 0 4px;font-size:15px;line-height:1.5;font-weight:700;color:#292524">Qualio</p><p style="margin:0 0 18px;font-size:12px;line-height:1.5;color:#78716c">${escapeHtml(identity)}</p><p style="margin:0 0 14px;font-size:12px;line-height:1.6;color:#78716c">${escapeHtml(reason)} ${escapeHtml(optOut)}</p><p style="margin:0;font-size:12px;line-height:1.6">${footerLinks}</p></td></tr></table></td></tr></table></body></html>`
  const cardText = input.card
    ? [reportCardSummary(input.card), ...input.card.problems.map((problem, index) => `${index + 1}. ${problem.title} (${plural(problem.mentions, 'avis', 'avis')})`), input.card.quote ? `« ${input.card.quote.text} »` : ''].filter(Boolean).join('\n')
    : ''
  const text = [
    input.body,
    cardText,
    '—',
    `Qualio · ${identity}`,
    `${reason} ${optOut}`,
    input.unsubscribeUrl ? `Me désinscrire : ${input.unsubscribeUrl}` : '',
    `Vos données : ${site}/confidentialite · Contact : ${LEGAL.email}`,
  ].filter(Boolean).join('\n\n')
  return { html, text }
}
