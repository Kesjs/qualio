import { ImageResponse } from 'next/og'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { loadReportCard } from '@/lib/admin/acquisition-report-card'

/** Image d'aperçu d'un rapport : affichée dans l'email de prospection et reprise comme aperçu de partage (LinkedIn, X, WhatsApp). 1200×600, publique comme le rapport (même jeton secret). */
const WIDTH = 1200
const HEIGHT = 600
const ACCENT = '#c2410c'
const INK = '#1c1917'
const MUTED = '#78716c'
const LINE = '#e7e2dc'

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value)
const frNumber = (value: number) => value.toFixed(1).replace('.', ',')

function Star({ size, filled }: { size: number; filled: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={filled ? '#ee6018' : '#e7e2dc'} />
    </svg>
  )
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t') ?? ''
  if (!/^[\w-]{12,80}$/.test(token)) return new NextResponse('Not found', { status: 404 })
  const card = await loadReportCard(getSupabaseAdminClient() as any, token)
  if (!card) return new NextResponse('Not found', { status: 404 })

  const filledStars = card.averageRating != null ? Math.round(card.averageRating) : 0
  const maxCount = Math.max(1, ...card.distribution)
  const top = card.problems[0]

  return new ImageResponse(
    (
      <div style={{ width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column', background: '#ffffff', border: `2px solid ${LINE}`, borderRadius: 24, padding: 54, color: INK }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: ACCENT }}>Qualio</div>
          <div style={{ display: 'flex', fontSize: 26, color: MUTED }}>{`Analyse des avis ${card.sourceLabel}`}</div>
        </div>

        <div style={{ display: 'flex', marginTop: 28, fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{clip(card.subjectName, 38)}</div>

        <div style={{ display: 'flex', marginTop: 28, alignItems: 'center' }}>
          {card.averageRating != null && (
            <div style={{ display: 'flex', flexDirection: 'column', width: 360 }}>
              <div style={{ display: 'flex', fontSize: 112, fontWeight: 700, lineHeight: 1 }}>{frNumber(card.averageRating)}</div>
              <div style={{ display: 'flex', marginTop: 10 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={40} filled={star <= filledStars} />
                ))}
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 26, color: MUTED }}>{`${card.reviewCount} avis analysés`}</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: card.averageRating != null ? 40 : 0 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = card.distribution[star - 1] ?? 0
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', marginTop: star === 5 ? 0 : 8 }}>
                  <div style={{ display: 'flex', width: 28, fontSize: 24, color: MUTED }}>{String(star)}</div>
                  <div style={{ display: 'flex', flex: 1, height: 18, background: '#f5f5f4', borderRadius: 9 }}>
                    <div style={{ display: 'flex', width: `${Math.round((count / maxCount) * 100)}%`, height: 18, background: star <= 2 ? '#ee6018' : '#d6d3d1', borderRadius: 9 }} />
                  </div>
                  <div style={{ display: 'flex', width: 64, justifyContent: 'flex-end', fontSize: 24, color: MUTED }}>{String(count)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {top && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', padding: '18px 26px', background: '#fff1e9', border: `2px solid #fed7aa`, borderRadius: 18 }}>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: ACCENT }}>{`Priorité n°1 · ${top.mentions} avis cités`}</div>
            <div style={{ display: 'flex', marginTop: 6, fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{clip(top.title, 80)}</div>
          </div>
        )}
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
    },
  )
}
