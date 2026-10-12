import { Skeleton } from '@/components/dashboard/ui'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-16" role="status" aria-label="Chargement du tableau de bord">
      <div className="space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-80 max-w-full" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-[104px]" />)}</div>
      <Skeleton className="h-48" />
      <span className="sr-only">Chargement du tableau de bord…</span>
    </div>
  )
}
