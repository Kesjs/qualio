import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { getAcquisitionPipeline } from '@/lib/admin/acquisition'
import { Notice, PageHeader } from '@/components/admin/ui'
import { senderIdentityReady } from '@/lib/legal'
import { AcquisitionPipeline } from '@/components/admin/AcquisitionPipeline'

export const metadata: Metadata = { title: 'Acquisition' }
export const dynamic = 'force-dynamic'

export default async function AcquisitionPage() {
  await getAdminContext()
  const data = await getAcquisitionPipeline()
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Acquisition" title="Trouver les premiers utilisateurs" description="Ajoute des prospects, relis les messages, envoie, puis suis les réponses : tout se fait sur cette page." />
      {!senderIdentityReady() && <Notice tone="danger"><strong>Envoi bloqué :</strong> renseigne l’éditeur et l’adresse postale dans <code className="font-mono text-xs">src/lib/legal.ts</code>. Ils s’affichent dans le pied de chaque email, et la loi les exige dans un message commercial.</Notice>}
      {data.stats.pausedForBounces && <Notice tone="danger"><strong>Envois suspendus :</strong> le taux de rebond est de {data.stats.bounceRate} %. Vérifie les adresses avant de reprendre.</Notice>}
      {data.failed && <Notice>Une partie des données n’a pas pu être chargée. Vérifie que la migration « acquisition_tracking » est appliquée, puis recharge la page.</Notice>}
      <AcquisitionPipeline data={data} />
    </div>
  )
}
