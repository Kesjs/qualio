import { FormAuditPage } from '@/components/dashboard/FormAuditPage'

export default async function AuditPage({ params, searchParams }: {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ scanId?: string; signature?: string; previousScanId?: string }>
}) {
  const { siteId } = await params
  const query = await searchParams
  return <FormAuditPage key={`${siteId}:${query.scanId ?? ''}:${query.signature ?? ''}`} siteId={siteId} initialScanId={query.scanId} signature={query.signature} previousScanId={query.previousScanId} />
}
