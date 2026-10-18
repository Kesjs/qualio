/** Gabarit de l'email du lundi (Pro et Agence) : texte écrit en dur, chiffres et contenu pris dans les synthèses déjà générées. */
export type DigestProject = {
  name: string
  newCount: number
  /** Recommandation n°1 de la synthèse, absente si le projet n'a pas eu de synthèse cette semaine. */
  recommendation: { title: string; rationale?: string | null } | null
  topTheme: string | null
  /** Décisions déjà prises sur ce projet, avec leur effet (mesuré 14 jours après la décision). */
  decisions?: Array<{ title: string; effect: string }>
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char)
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count > 1 ? many : one}`
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value
}

export function buildWeeklyDigestEmail({ origin, unsubscribeToken, projects }: { origin: string; unsubscribeToken: string; projects: DigestProject[] }) {
  const total = projects.reduce((sum, project) => sum + project.newCount, 0)
  const single = projects.length === 1
  const first = projects.find((project) => project.recommendation)?.recommendation ?? null

  // Objet variable, avec un chiffre utile.
  const subject = single && first
    ? truncate(`${plural(total, 'nouvel avis', 'nouveaux avis')} : ${first.title}`, 70)
    : `${plural(total, 'nouvel avis', 'nouveaux avis')} sur ${plural(projects.length, 'projet', 'projets')} cette semaine`

  const openUrl = `${origin}/dashboard`
  const unsubscribeUrl = `${origin}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`

  const blocks = projects.map((project) => {
    const recommendation = project.recommendation
    const decisions = project.decisions ?? []
    const decisionsHtml = decisions.length ? `<div style="margin-top:12px"><p style="margin:0 0 4px;font-weight:700">Vos décisions</p><ul style="margin:0;padding-left:18px;color:#555">${decisions.map((item) => `<li>${escapeHtml(item.title)} : ${escapeHtml(item.effect)}</li>`).join('')}</ul></div>` : ''
    return `<div style="border-top:1px solid #eee;padding-top:12px;margin-top:16px">${single ? '' : `<h2 style="margin:0 0 4px">${escapeHtml(project.name)}</h2>`}<p style="margin:0 0 8px;color:#555">${plural(project.newCount, 'nouvel avis', 'nouveaux avis')} cette semaine${project.topTheme ? ` · thème n°1 : ${escapeHtml(project.topTheme)}` : ''}.</p>${recommendation ? `<h3 style="margin:0 0 4px">${escapeHtml(recommendation.title)}</h3><p style="margin:0">${escapeHtml(recommendation.rationale ?? 'Une recommandation sourcée attend votre décision.')}</p>` : '<p style="margin:0;color:#555">Pas assez de nouveaux avis pour une synthèse cette semaine.</p>'}${decisionsHtml}</div>`
  }).join('')

  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171717"><p style="color:#ee6018;font-weight:700">QUALIO</p><h1>Votre semaine d’avis</h1><p>${plural(total, 'nouvel avis', 'nouveaux avis')}${single ? '' : ` sur ${plural(projects.length, 'projet', 'projets')}`}.</p>${blocks}<p style="margin-top:24px"><a href="${openUrl}" style="display:inline-block;background:#ee6018;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Ouvrir Qualio</a></p><p style="font-size:12px;color:#666"><a href="${unsubscribeUrl}">Ne plus recevoir le résumé hebdomadaire</a></p></div>`

  const text = [
    `${plural(total, 'nouvel avis', 'nouveaux avis')}${single ? '' : ` sur ${plural(projects.length, 'projet', 'projets')}`} cette semaine.`,
    ...projects.map((project) => [
      `${single ? '' : `${project.name} : `}${project.recommendation?.title ?? 'Pas assez de nouveaux avis pour une synthèse.'}`,
      ...(project.decisions?.length ? ['Vos décisions :', ...project.decisions.map((item) => `- ${item.title} : ${item.effect}`)] : []),
    ].join('\n')),
    `Ouvrir Qualio : ${openUrl}`,
    `Se désinscrire : ${unsubscribeUrl}`,
  ].join('\n\n')

  return { subject, html, text }
}
