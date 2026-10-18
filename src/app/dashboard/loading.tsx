export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-16" role="status" aria-label="Chargement du tableau de bord">
      <div className="space-y-3"><div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/[0.06]" /><div className="h-8 w-80 max-w-full rounded bg-gray-100 dark:bg-white/[0.06]" /><div className="h-4 w-96 max-w-full rounded bg-gray-100 dark:bg-white/[0.06]" /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-[104px] rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]" />)}</div>
      <div className="h-48 rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]" />
      <span className="sr-only">Chargement du tableau de bord…</span>
    </div>
  )
}
