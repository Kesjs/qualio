import { Resend } from 'resend'

type AdminClient = ReturnType<typeof import('@/lib/supabase/server').getSupabaseAdminClient>

export async function sendMonitorFailureEmail(admin: AdminClient, scanId: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[monitor] RESEND_API_KEY is not configured; alert skipped.')
    return
  }

  const { data: scan } = await admin.from('scans').select('id, user_id, site_id').eq('id', scanId).maybeSingle()
  if (!scan) return
  const { data: issues } = await admin.from('issues').select('title, category').eq('scan_id', scanId)
  if (!issues?.length) return

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(scan.user_id)
  if (userError || !userData.user?.email) {
    console.warn('[monitor] Could not resolve the monitor owner email.', userError?.message)
    return
  }
  const { data: site } = await admin.from('sites').select('name, url').eq('id', scan.site_id).maybeSingle()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const siteName = site?.name || site?.url || 'Votre site'
  const issueList = issues.slice(0, 5).map((issue) => `<li>${escapeHtml(issue.title)}${issue.category ? ` <span>(${escapeHtml(issue.category)})</span>` : ''}</li>`).join('')
  const { error } = await new Resend(apiKey).emails.send({
    from: process.env.MONITOR_ALERT_FROM || 'Qualio <onboarding@resend.dev>',
    to: userData.user.email,
    subject: `Échec détecté sur ${siteName}`,
    html: `<p>La surveillance automatique a détecté un échec sur <strong>${escapeHtml(siteName)}</strong>.</p><ul>${issueList}</ul><p><a href="${baseUrl}/dashboard/scans/${scan.id}">Consulter le scan</a></p>`,
  })
  if (error) console.error('[monitor] Email alert failed:', error)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}
