import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { getAcquisitionPipeline } from '@/lib/admin/acquisition'
import { Notice, PageHeader } from '@/components/admin/ui'
import { AcquisitionPipeline } from '@/components/admin/AcquisitionPipeline'

export const metadata: Metadata = { title: 'Acquisition' }
export const dynamic = 'force-dynamic'

export default async function AcquisitionPage() {
  await getAdminContext()
  const data = await getAcquisitionPipeline()
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Acquisition « Valeur d’abord »"
        description="Cible des SaaS, marques e-commerce et agences produit, génère un vrai rapport /rapport/[token] sur leurs avis publics, puis envoie une accroche sourcée dont tu mesures l’ouverture réelle."
      />
      {data.failed && (
        <Notice>
          Une partie des données n’a pas pu être chargée. Vérifie que la base Supabase est bien active et que les migrations sont appliquées, puis recharge la page.
        </Notice>
      )}
      <AcquisitionPipeline data={data} />
    </div>
  )
}
